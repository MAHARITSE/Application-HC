import { NextResponse } from "next/server";
import { getGrades, createGrade, updateGrade } from "@/db";

export async function GET() {
  try {
    const result = getGrades().sort((a, b) => a.tauxHoraire - b.tauxHoraire);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updated = updateGrade(Number(body.id), {
      tauxHoraire: body.tauxHoraire != null ? Number(body.tauxHoraire) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.code?.trim() || !body.libelle?.trim()) {
      return NextResponse.json({ error: "Code et libellé requis" }, { status: 400 });
    }

    const existing = getGrades().find((g) => g.code.toUpperCase() === body.code.trim().toUpperCase());
    if (existing) {
      return NextResponse.json({ error: "Code grade déjà existant" }, { status: 409 });
    }

    const newGrade = createGrade({
      code: body.code.trim().toUpperCase(),
      libelle: body.libelle.trim(),
      tauxHoraire: Number(body.tauxHoraire) || 6000,
    });

    return NextResponse.json(newGrade);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
