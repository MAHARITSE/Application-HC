import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants, heuresEnseignement } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db.execute(sql`
    SELECT e.*, g.code AS grade_code, g.libelle AS grade_libelle,
           g.taux_horaire, g.obligation_service
    FROM enseignants e
    LEFT JOIN grades_taux g ON e.grade_id = g.id
    WHERE e.id = ${Number(id)}
    LIMIT 1
  `);
  if (!rows.rows.length) {
    return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  }
  return NextResponse.json(rows.rows[0]);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const {
    nomPrenom, cin, dateNaissance, lieuNaissance, nationalite,
    adresse, telephone, email, rib, banque, statut, specialite,
    gradeId, etablissementPrincipal, dateRecrutement,
  } = body;

  const [row] = await db
    .update(enseignants)
    .set({
      nomPrenom, cin,
      dateNaissance:  dateNaissance  || null,
      lieuNaissance:  lieuNaissance  || null,
      nationalite:    nationalite    || "Malgache",
      adresse:        adresse        || null,
      telephone:      telephone      || null,
      email:          email          || null,
      rib:            rib            || null,
      banque:         banque         || null,
      statut,
      specialite:     specialite     || null,
      gradeId:        gradeId        ? Number(gradeId) : null,
      etablissementPrincipal: etablissementPrincipal || null,
      dateRecrutement: dateRecrutement || null,
    })
    .where(eq(enseignants.id, Number(id)))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db
    .delete(heuresEnseignement)
    .where(eq(heuresEnseignement.enseignantId, Number(id)));
  await db.delete(enseignants).where(eq(enseignants.id, Number(id)));
  return NextResponse.json({ ok: true });
}
