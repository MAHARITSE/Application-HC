import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

// Pendant le build (sans DATABASE_URL), on évite de crasher.
// Les routes API doivent avoir DATABASE_URL à l'exécution.
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaDrizzleDb?: ReturnType<typeof drizzle>;
};

let pool: Pool;
let dbInstance: ReturnType<typeof drizzle>;

if (!databaseUrl) {
  // Mock pool minimal pour permettre le build
  if (process.env.NODE_ENV === "production") {
    console.warn("DATABASE_URL not set – using dummy DB for build");
  }
  pool = new Pool({
    connectionString: "postgres://user:pass@localhost:5432/dummy",
  });
  // Empêcher les connexions réelles pendant le build
  pool.connect = (() => {
    throw new Error("DATABASE_URL is required at runtime");
  }) as any;
  dbInstance = drizzle(pool);
} else {
  pool = globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  dbInstance = globalForDb.__arenaDrizzleDb ?? drizzle(pool);
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaDrizzleDb = dbInstance;
  }
}

export const db = dbInstance;
export { pool };
