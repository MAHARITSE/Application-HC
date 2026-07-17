import { NextResponse } from "next/server";
import { db } from "@/db";
import { paiements } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enseignantId = searchParams.get("enseignantId");
    const anneeId = searchParams.get("anneeId");

    const conditions = [];
    if (enseignantId) conditions.push(eq(paiements.enseignantId, Number(enseignantId)));
    if (anneeId) conditions.push(eq(paiements.anneeId, Number(anneeId)));

    let result;
    if (conditions.length > 0) {
      result = await db.select().from(paiements).where(and(...conditions)).orderBy(desc(paiements.createdAt));
    } else {
      result = await db.select().from(paiements).orderBy(desc(paiements.createdAt));
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.enseignantId || !body.anneeId) {
      return NextResponse.json({ error: "enseignantId et anneeId requis" }, { status: 400 });
    }
    const [result] = await db
      .insert(paiements)
      .values({
        enseignantId: Number(body.enseignantId),
        anneeId: Number(body.anneeId),
        montantAvance: body.montantAvance != null ? Number(body.montantAvance) : 0,
        dateAvance: body.dateAvance || null,
        pourcentageTranche: body.pourcentageTranche != null ? Number(body.pourcentageTranche) : 100,
        montantPaye: body.montantPaye != null ? Number(body.montantPaye) : 0,
        datePaiement: body.datePaiement || null,
        reference: body.reference?.trim() || null,
        statut: body.statut || (body.pourcentageTranche >= 100 ? "Payé" : "Partiel"),
      })
      .returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await db.delete(paiements).where(eq(paiements.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
