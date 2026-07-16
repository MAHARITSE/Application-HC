import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

export const enseignants = pgTable("enseignants", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  prenoms: varchar("prenoms", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 10 }).notNull(), // A, MC, PR, PRT
  etablissement: varchar("etablissement", { length: 255 }).notNull(),
  statut: varchar("statut", { length: 20 }).notNull(), // Permanent, Vacataire
  heuresET: numeric("heures_et", { precision: 10, scale: 2 }).notNull().default("0"),
  heuresED: numeric("heures_ed", { precision: 10, scale: 2 }).notNull().default("0"),
  heuresEP: numeric("heures_ep", { precision: 10, scale: 2 }).notNull().default("0"),
  heuresSoutenance: numeric("heures_soutenance", { precision: 10, scale: 2 }).notNull().default("0"),
  heuresRecherche: numeric("heures_recherche", { precision: 10, scale: 2 }).notNull().default("0"),
  rib: varchar("rib", { length: 50 }).notNull().default(""),
  avance: numeric("avance", { precision: 12, scale: 2 }).notNull().default("0"),
  dateAvance: varchar("date_avance", { length: 20 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Enseignant = typeof enseignants.$inferSelect;
export type NewEnseignant = typeof enseignants.$inferInsert;
