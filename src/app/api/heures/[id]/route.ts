import { NextResponse } from "next/server";
import { db } from "@/db";
import { heures } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {};
    if (body.faculteId !== undefined) updateData.faculteId = body.faculteId ? Number(body.faculteId) : null;
    if (body.gradeId !== undefined) updateData.gradeId = body.gradeId ? Number(body.gradeId) : null;
    if (body.statut !== undefined) updateData.statut = body.statut;
    if (body.heuresET !== undefined) updateData.heuresET = Number(body.heuresET) || 0;
    if (body.heuresED !== undefined) updateData.heuresED = Number(body.heuresED) || 0;
    if (body.heuresEP !== undefined) updateData.heuresEP = Number(body.heuresEP) || 0;
    if (body.heuresSoutenance !== undefined) updateData.heuresSoutenance = Number(body.heuresSoutenance) || 0;
    if (body.heuresRecherche !== undefined) updateData.heuresRecherche = Number(body.heuresRecherche) || 0;
    if (body.obligation !== undefined) updateData.obligation = Number(body.obligation);

    const [result] = await db.update(heures).set(updateData).where(eq(heures.id, Number(id))).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(heures).where(eq(heures.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [result] = await db.select().from(heures).where(eq(heures.id, Number(id)));
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
