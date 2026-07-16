import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants, gradesTaux, heuresEnseignement } from "@/db/schema";
import { eq, ilike, or, sql, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search  = searchParams.get("search") || "";
  const anneeId = searchParams.get("anneeId") ? Number(searchParams.get("anneeId")) : null;

  // Jointure enseignant + grade + agrégat des heures
  const rows = await db.execute(sql`
    SELECT
      e.id,
      e.nom_prenom,
      e.cin,
      e.date_naissance,
      e.lieu_naissance,
      e.nationalite,
      e.adresse,
      e.telephone,
      e.email,
      e.rib,
      e.banque,
      e.statut,
      e.specialite,
      e.etablissement_principal,
      e.date_recrutement,
      e.created_at,
      e.grade_id,
      g.code            AS grade_code,
      g.libelle         AS grade_libelle,
      g.taux_horaire,
      g.obligation_service,
      COALESCE(SUM(h.et),0)          AS total_et,
      COALESCE(SUM(h.ed),0)          AS total_ed,
      COALESCE(SUM(h.ep),0)          AS total_ep,
      COALESCE(SUM(h.soutenance),0)  AS total_soutenance,
      COALESCE(SUM(h.recherche),0)   AS total_recherche,
      COALESCE(SUM(h.avance),0)      AS total_avance
    FROM enseignants e
    LEFT JOIN grades_taux g ON e.grade_id = g.id
    LEFT JOIN heures_enseignement h ON h.enseignant_id = e.id
      ${anneeId ? sql`AND h.annee_id = ${anneeId}` : sql``}
    WHERE (
      e.nom_prenom ILIKE ${"%" + search + "%"}
      OR e.etablissement_principal ILIKE ${"%" + search + "%"}
      OR e.cin ILIKE ${"%" + search + "%"}
    )
    GROUP BY e.id, g.id
    ORDER BY e.nom_prenom ASC
  `);

  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    nomPrenom, cin, dateNaissance, lieuNaissance, nationalite,
    adresse, telephone, email, rib, banque, statut, specialite,
    gradeId, etablissementPrincipal, dateRecrutement,
  } = body;

  if (!nomPrenom || !statut) {
    return NextResponse.json({ error: "Nom et statut requis" }, { status: 400 });
  }

  const [row] = await db
    .insert(enseignants)
    .values({
      nomPrenom, cin, dateNaissance, lieuNaissance,
      nationalite: nationalite || "Malgache",
      adresse, telephone, email, rib, banque,
      statut, specialite,
      gradeId: gradeId ? Number(gradeId) : null,
      etablissementPrincipal, dateRecrutement,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
