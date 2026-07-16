import { NextResponse } from "next/server";
import { db } from "@/db";
import { facultes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(facultes).orderBy(asc(facultes.etablissement));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [result] = await db.insert(facultes).values({
      etablissement: body.etablissement,
      mention: body.mention || null,
      parcours: body.parcours || null,
      niveau: body.niveau || null,
      code: body.code || null,
    }).returning();
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
    
    await db.delete(facultes).where(eq(facultes.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
