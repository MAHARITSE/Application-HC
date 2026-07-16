import { NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants, grades, heures, obligations, paiements, annees } from "@/db/schema";
import { eq, ilike, or, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const anneeId = searchParams.get("anneeId");

    // Get enseignants with their grades
    let baseQuery = db
      .select({
        id: enseignants.id,
        nomPrenom: enseignants.nomPrenom,
        cin: enseignants.cin,
        dateNaissance: enseignants.dateNaissance,
        telephone: enseignants.telephone,
        email: enseignants.email,
        rib: enseignants.rib,
        banque: enseignants.banque,
        statut: enseignants.statut,
        specialite: enseignants.specialite,
        gradeId: enseignants.gradeId,
        etablissementPrincipal: enseignants.etablissementPrincipal,
        gradeCode: grades.code,
        gradeTaux: grades.tauxHoraire,
        gradeObligation: grades.obligationService,
      })
      .from(enseignants)
      .leftJoin(grades, eq(enseignants.gradeId, grades.id));

    const enseignantsData = search
      ? await baseQuery.where(
          or(
            ilike(enseignants.nomPrenom, `%${search}%`),
            ilike(enseignants.etablissementPrincipal, `%${search}%`)
          )
        )
      : await baseQuery;

    if (!anneeId) {
      return NextResponse.json(enseignantsData);
    }

    // Get heures aggregated per enseignant for the year
    const heuresData = await db
      .select({
        enseignantId: heures.enseignantId,
        totalET: sql<number>`COALESCE(SUM(${heures.heuresET}), 0)`,
        totalED: sql<number>`COALESCE(SUM(${heures.heuresED}), 0)`,
        totalEP: sql<number>`COALESCE(SUM(${heures.heuresEP}), 0)`,
        totalSoutenance: sql<number>`COALESCE(SUM(${heures.heuresSoutenance}), 0)`,
        totalRecherche: sql<number>`COALESCE(SUM(${heures.heuresRecherche}), 0)`,
      })
      .from(heures)
      .where(eq(heures.anneeId, Number(anneeId)))
      .groupBy(heures.enseignantId);

    // Get obligations
    const oblData = await db
      .select()
      .from(obligations)
      .where(eq(obligations.anneeId, Number(anneeId)));

    // Get paiements (avances)
    const paiementsData = await db
      .select({
        enseignantId: paiements.enseignantId,
        totalAvance: sql<number>`COALESCE(SUM(${paiements.montantAvance}), 0)`,
      })
      .from(paiements)
      .where(eq(paiements.anneeId, Number(anneeId)))
      .groupBy(paiements.enseignantId);

    // Merge data
    const result = enseignantsData.map(e => {
      const h = heuresData.find(x => x.enseignantId === e.id);
      const o = oblData.find(x => x.enseignantId === e.id);
      const p = paiementsData.find(x => x.enseignantId === e.id);

      return {
        ...e,
        total_et: h?.totalET || 0,
        total_ed: h?.totalED || 0,
        total_ep: h?.totalEP || 0,
        total_soutenance: h?.totalSoutenance || 0,
        total_recherche: h?.totalRecherche || 0,
        total_avance: p?.totalAvance || 0,
        obligation_custom: o?.heuresObligation || null,
        exempte: o?.exempte || false,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [result] = await db.insert(enseignants).values({
      nomPrenom: body.nomPrenom,
      cin: body.cin || null,
      dateNaissance: body.dateNaissance || null,
      lieuNaissance: body.lieuNaissance || null,
      nationalite: body.nationalite || "Malagasy",
      adresse: body.adresse || null,
      telephone: body.telephone || null,
      email: body.email || null,
      rib: body.rib || null,
      banque: body.banque || null,
      statut: body.statut || "Permanent",
      specialite: body.specialite || null,
      gradeId: body.gradeId ? Number(body.gradeId) : null,
      etablissementPrincipal: body.etablissementPrincipal || null,
      dateRecrutement: body.dateRecrutement || null,
    }).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
