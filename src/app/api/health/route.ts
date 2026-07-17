export const dynamic = "force-dynamic";

export async function GET() {
  // JSON-only mode: toujours OK (les fichiers JSON sont toujours accessibles)
  return Response.json({ ok: true, mode: "json-only" });
}
