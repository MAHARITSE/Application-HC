import { NextResponse } from "next/server";
import { db } from "@/db";
import { grades } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(grades).orderBy(asc(grades.tauxHoraire));
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

    const [result] = await db
      .update(grades)
      .set({
        tauxHoraire: body.tauxHoraire != null ? Number(body.tauxHoraire) : undefined,
      })
      .where(eq(grades.id, body.id))
      .returning();
    return NextResponse.json(result);
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
    const [result] = await db
      .insert(grades)
      .values({
        code: body.code.trim().toUpperCase(),
        libelle: body.libelle.trim(),
        tauxHoraire: Number(body.tauxHoraire) || 6000,
      })
      .returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.toLowerCase().includes("unique")) {
      return NextResponse.json({ error: "Code grade déjà existant" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
