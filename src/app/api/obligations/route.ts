import { NextResponse } from "next/server";
import { db } from "@/db";
import { obligations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enseignantId = searchParams.get("enseignantId");
    const anneeId = searchParams.get("anneeId");

    if (enseignantId && anneeId) {
      const result = await db.select().from(obligations)
        .where(and(
          eq(obligations.enseignantId, Number(enseignantId)),
          eq(obligations.anneeId, Number(anneeId))
        ));
      return NextResponse.json(result);
    }

    const result = await db.select().from(obligations);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if exists
    const existing = await db.select().from(obligations)
      .where(and(
        eq(obligations.enseignantId, Number(body.enseignantId)),
        eq(obligations.anneeId, Number(body.anneeId))
      ));

    if (existing.length > 0) {
      const [result] = await db.update(obligations).set({
        heuresObligation: body.heuresObligation ?? 0,
        exempte: body.exempte ?? false,
        motifExemption: body.motifExemption || null,
      }).where(eq(obligations.id, existing[0].id)).returning();
      return NextResponse.json(result);
    }

    const [result] = await db.insert(obligations).values({
      enseignantId: Number(body.enseignantId),
      anneeId: Number(body.anneeId),
      heuresObligation: body.heuresObligation ?? 0,
      exempte: body.exempte ?? false,
      motifExemption: body.motifExemption || null,
    }).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
