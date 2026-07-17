import { NextResponse } from "next/server";
import { db } from "@/db";
import { heures, facultes, grades } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enseignantId = searchParams.get("enseignantId");
    const anneeId = searchParams.get("anneeId");

    if (!enseignantId || !anneeId) {
      return NextResponse.json(
        { error: "enseignantId and anneeId required" },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        heures: heures,
        faculte: facultes,
        grade: grades,
      })
      .from(heures)
      .leftJoin(facultes, eq(heures.faculteId, facultes.id))
      .leftJoin(grades, eq(heures.gradeId, grades.id))
      .where(
        and(
          eq(heures.enseignantId, Number(enseignantId)),
          eq(heures.anneeId, Number(anneeId))
        )
      )
      .orderBy(heures.id);

    // Flatten for frontend compat but keep structure
    const mapped = result.map((r) => ({
      id: r.heures.id,
      enseignantId: r.heures.enseignantId,
      anneeId: r.heures.anneeId,
      faculteId: r.heures.faculteId,
      gradeId: r.heures.gradeId,
      statut: r.heures.statut,
      heuresET: r.heures.heuresET,
      heuresED: r.heures.heuresED,
      heuresEP: r.heures.heuresEP,
      heuresSoutenance: r.heures.heuresSoutenance,
      heuresRecherche: r.heures.heuresRecherche,
      obligation: r.heures.obligation,
      // jointures
      faculte: r.faculte,
      grade: r.grade,
    }));

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.enseignantId) return NextResponse.json({ error: "enseignantId requis" }, { status: 400 });
    if (!body.anneeId) return NextResponse.json({ error: "anneeId requis" }, { status: 400 });
    if (!body.gradeId) return NextResponse.json({ error: "Grade obligatoire (stocké dans heures pour historique)" }, { status: 400 });
    if (!body.statut) return NextResponse.json({ error: "Statut obligatoire (Permanent/Vacataire)" }, { status: 400 });

    const statut = body.statut === "Permanent" ? "Permanent" : "Vacataire";
    // Obligation défaut selon prompt: 125h, mais 0 pour vacataires
    let obligation = body.obligation;
    if (obligation == null || obligation === "") {
      obligation = statut === "Vacataire" ? 0 : 125;
    }
    obligation = Number(obligation);

    const [result] = await db
      .insert(heures)
      .values({
        enseignantId: Number(body.enseignantId),
        anneeId: Number(body.anneeId),
        faculteId: body.faculteId ? Number(body.faculteId) : null,
        gradeId: body.gradeId ? Number(body.gradeId) : null,
        statut,
        heuresET: body.heuresET != null ? Number(body.heuresET) : 0,
        heuresED: body.heuresED != null ? Number(body.heuresED) : 0,
        heuresEP: body.heuresEP != null ? Number(body.heuresEP) : 0,
        heuresSoutenance: body.heuresSoutenance != null ? Number(body.heuresSoutenance) : 0,
        heuresRecherche: body.heuresRecherche != null ? Number(body.heuresRecherche) : 0,
        obligation,
      })
      .returning();

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
