import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { facultesParcours } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(facultesParcours)
    .orderBy(asc(facultesParcours.etablissement), asc(facultesParcours.mention));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { etablissement, mention, parcours, niveau, code } = body;
  if (!etablissement) {
    return NextResponse.json({ error: "Établissement requis" }, { status: 400 });
  }
  const [row] = await db
    .insert(facultesParcours)
    .values({ etablissement, mention, parcours, niveau, code })
    .returning();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, etablissement, mention, parcours, niveau, code } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const [row] = await db
    .update(facultesParcours)
    .set({ etablissement, mention, parcours, niveau, code })
    .where(eq(facultesParcours.id, id))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await db.delete(facultesParcours).where(eq(facultesParcours.id, id));
  return NextResponse.json({ ok: true });
}
