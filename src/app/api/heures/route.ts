import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { heuresEnseignement, facultesParcours } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const enseignantId = Number(searchParams.get("enseignantId"));
  const anneeId      = Number(searchParams.get("anneeId"));

  if (!enseignantId || !anneeId) {
    return NextResponse.json({ error: "enseignantId et anneeId requis" }, { status: 400 });
  }

  const rows = await db.execute(sql`
    SELECT h.*, f.etablissement AS fac_etab, f.mention, f.parcours
    FROM heures_enseignement h
    LEFT JOIN facultes_parcours f ON h.faculte_parcours_id = f.id
    WHERE h.enseignant_id = ${enseignantId}
      AND h.annee_id      = ${anneeId}
    ORDER BY h.etablissement ASC
  `);

  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    anneeId, enseignantId, faculteParcoursId, etablissement, niveau,
    et, ed, ep, soutenance, recherche, avance, dateAvance, numeroEtat, tranche,
  } = body;

  if (!anneeId || !enseignantId) {
    return NextResponse.json({ error: "anneeId et enseignantId requis" }, { status: 400 });
  }

  const [row] = await db
    .insert(heuresEnseignement)
    .values({
      anneeId:           Number(anneeId),
      enseignantId:      Number(enseignantId),
      faculteParcoursId: faculteParcoursId ? Number(faculteParcoursId) : null,
      etablissement,
      niveau,
      et:          Number(et)          || 0,
      ed:          Number(ed)          || 0,
      ep:          Number(ep)          || 0,
      soutenance:  Number(soutenance)  || 0,
      recherche:   Number(recherche)   || 0,
      avance:      Number(avance)      || 0,
      dateAvance:  dateAvance          || null,
      numeroEtat:  numeroEtat          || null,
      tranche:     tranche             || "Première tranche",
    })
    .onConflictDoUpdate({
      target: [
        heuresEnseignement.anneeId,
        heuresEnseignement.enseignantId,
        heuresEnseignement.etablissement,
        heuresEnseignement.niveau,
      ],
      set: {
        et:         Number(et)         || 0,
        ed:         Number(ed)         || 0,
        ep:         Number(ep)         || 0,
        soutenance: Number(soutenance) || 0,
        recherche:  Number(recherche)  || 0,
        avance:     Number(avance)     || 0,
        dateAvance: dateAvance         || null,
        numeroEtat: numeroEtat         || null,
        tranche:    tranche            || "Première tranche",
        faculteParcoursId: faculteParcoursId ? Number(faculteParcoursId) : null,
      },
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const {
    id, et, ed, ep, soutenance, recherche, avance,
    dateAvance, numeroEtat, tranche, etablissement, niveau, faculteParcoursId,
  } = body;

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const [row] = await db
    .update(heuresEnseignement)
    .set({
      etablissement, niveau,
      faculteParcoursId: faculteParcoursId ? Number(faculteParcoursId) : null,
      et:         Number(et)         || 0,
      ed:         Number(ed)         || 0,
      ep:         Number(ep)         || 0,
      soutenance: Number(soutenance) || 0,
      recherche:  Number(recherche)  || 0,
      avance:     Number(avance)     || 0,
      dateAvance: dateAvance         || null,
      numeroEtat: numeroEtat         || null,
      tranche:    tranche            || "Première tranche",
    })
    .where(eq(heuresEnseignement.id, Number(id)))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await db.delete(heuresEnseignement).where(eq(heuresEnseignement.id, id));
  return NextResponse.json({ ok: true });
}
