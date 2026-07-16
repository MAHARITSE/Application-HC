import { NextResponse } from "next/server";
import { db } from "@/db";
import { heures, facultes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enseignantId = searchParams.get("enseignantId");
    const anneeId = searchParams.get("anneeId");

    if (!enseignantId || !anneeId) {
      return NextResponse.json({ error: "enseignantId and anneeId required" }, { status: 400 });
    }

    const result = await db
      .select({
        heures: heures,
        faculte: facultes,
      })
      .from(heures)
      .leftJoin(facultes, eq(heures.faculteId, facultes.id))
      .where(and(
        eq(heures.enseignantId, Number(enseignantId)),
        eq(heures.anneeId, Number(anneeId))
      ));

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [result] = await db.insert(heures).values({
      enseignantId: Number(body.enseignantId),
      anneeId: Number(body.anneeId),
      faculteId: body.faculteId ? Number(body.faculteId) : null,
      heuresET: body.heuresET || 0,
      heuresED: body.heuresED || 0,
      heuresEP: body.heuresEP || 0,
      heuresSoutenance: body.heuresSoutenance || 0,
      heuresRecherche: body.heuresRecherche || 0,
    }).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
