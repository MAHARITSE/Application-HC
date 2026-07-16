import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { anneesUniversitaires } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(anneesUniversitaires)
    .orderBy(desc(anneesUniversitaires.libelle));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { libelle, tranche, active } = body;

  if (!libelle) {
    return NextResponse.json({ error: "Libellé requis" }, { status: 400 });
  }

  // Si actif, désactiver les autres
  if (active) {
    await db
      .update(anneesUniversitaires)
      .set({ active: false });
  }

  const [row] = await db
    .insert(anneesUniversitaires)
    .values({ libelle, tranche: tranche || "Première tranche", active: !!active })
    .onConflictDoUpdate({
      target: anneesUniversitaires.libelle,
      set: { tranche: tranche || "Première tranche", active: !!active },
    })
    .returning();

  return NextResponse.json(row);
}
