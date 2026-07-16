import { NextResponse } from "next/server";
import { db } from "@/db";
import { heures } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const [result] = await db.update(heures).set({
      faculteId: body.faculteId ? Number(body.faculteId) : null,
      heuresET: body.heuresET || 0,
      heuresED: body.heuresED || 0,
      heuresEP: body.heuresEP || 0,
      heuresSoutenance: body.heuresSoutenance || 0,
      heuresRecherche: body.heuresRecherche || 0,
    }).where(eq(heures.id, Number(id))).returning();
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
