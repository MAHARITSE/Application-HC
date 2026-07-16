import { NextResponse } from "next/server";
import { db } from "@/db";
import { annees } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(annees).orderBy(desc(annees.libelle));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [result] = await db.insert(annees).values({
      libelle: body.libelle,
      tranche: body.tranche || "Première tranche",
      active: body.active ?? false,
      appliquerIRSA: body.appliquerIRSA ?? true,
      tauxIRSA: body.tauxIRSA ?? 20,
      plafondPaiement: body.plafondPaiement || null,
    }).returning();
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
    
    const [result] = await db.update(annees).set({
      libelle: body.libelle,
      tranche: body.tranche,
      active: body.active,
      appliquerIRSA: body.appliquerIRSA,
      tauxIRSA: body.tauxIRSA,
      plafondPaiement: body.plafondPaiement || null,
    }).where(eq(annees.id, body.id)).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
