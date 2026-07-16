import { NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [result] = await db.select().from(enseignants).where(eq(enseignants.id, Number(id)));
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const [result] = await db.update(enseignants).set({
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
      updatedAt: new Date(),
    }).where(eq(enseignants.id, Number(id))).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(enseignants).where(eq(enseignants.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
