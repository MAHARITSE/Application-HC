import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gradesTaux } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(gradesTaux)
    .orderBy(gradesTaux.tauxHoraire);
  return NextResponse.json(rows);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, tauxHoraire, obligationService } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const [row] = await db
    .update(gradesTaux)
    .set({ tauxHoraire, obligationService })
    .where(eq(gradesTaux.id, id))
    .returning();
  return NextResponse.json(row);
}
