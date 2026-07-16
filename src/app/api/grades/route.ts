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
    
    const [result] = await db.update(grades).set({
      tauxHoraire: body.tauxHoraire,
      obligationService: body.obligationService,
    }).where(eq(grades.id, body.id)).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
