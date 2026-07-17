import { NextResponse } from "next/server";
import {
  getHeures,
  getFacultes,
  getGrades,
  createHeure,
  updateHeure,
  deleteHeure,
} from "@/db";

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

    const eid = Number(enseignantId);
    const aid = Number(anneeId);

    const allHeures = getHeures().filter(
      (h) => h.enseignantId === eid && h.anneeId === aid
    );

    const allFacultes = getFacultes();
    const allGrades = getGrades();

    const mapped = allHeures
      .sort((a, b) => a.id - b.id)
      .map((h) => ({
        id: h.id,
        enseignantId: h.enseignantId,
        anneeId: h.anneeId,
        faculteId: h.faculteId,
        gradeId: h.gradeId,
        statut: h.statut,
        heuresET: h.heuresET,
        heuresED: h.heuresED,
        heuresEP: h.heuresEP,
        heuresSoutenance: h.heuresSoutenance,
        heuresRecherche: h.heuresRecherche,
        obligation: h.obligation,
        // jointures
        faculte: h.faculteId ? allFacultes.find((f) => f.id === h.faculteId) || null : null,
        grade: h.gradeId ? allGrades.find((g) => g.id === h.gradeId) || null : null,
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
    let obligation = body.obligation;
    if (obligation == null || obligation === "") {
      obligation = statut === "Vacataire" ? 0 : 125;
    }
    obligation = Number(obligation);

    const newHeure = createHeure({
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
    });

    return NextResponse.json(newHeure);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
