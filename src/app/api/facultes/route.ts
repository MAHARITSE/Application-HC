import { NextResponse } from "next/server";
import { db } from "@/db";
import { facultes } from "@/db/schema";
import { and, asc, eq, ilike, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const field = searchParams.get("field"); // pour autocomplete distinct values
    const distinct = searchParams.get("distinct") === "true";

    // Autocomplete distinct values pour un champ donné
    if (field && distinct) {
      const allowed = ["etablissement", "domaine", "mention", "parcours", "niveau"] as const;
      if (!allowed.includes(field as any)) {
        return NextResponse.json({ error: "Champ invalide" }, { status: 400 });
      }
      // Use raw distinct query
      const col = (facultes as any)[field];
      const results = await db
        .selectDistinct({ value: col })
        .from(facultes)
        .where(q ? ilike(col, `%${q}%`) : undefined)
        .orderBy(asc(col))
        .limit(50);
      const values = results.map((r: any) => r.value).filter(Boolean);
      return NextResponse.json(values);
    }

    if (q) {
      const results = await db
        .select()
        .from(facultes)
        .where(
          sql`LOWER(${facultes.etablissement}) LIKE LOWER(${"%" + q + "%"}) OR LOWER(${facultes.domaine}) LIKE LOWER(${"%" + q + "%"}) OR LOWER(${facultes.mention}) LIKE LOWER(${"%" + q + "%"}) OR LOWER(${facultes.parcours}) LIKE LOWER(${"%" + q + "%"})`
        )
        .orderBy(asc(facultes.etablissement));
      return NextResponse.json(results);
    }

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

    const etablissement = body.etablissement?.trim();
    const domaine = body.domaine?.trim();
    const mention = body.mention?.trim();

    if (!etablissement) return NextResponse.json({ error: "Établissement obligatoire" }, { status: 400 });
    if (!domaine) return NextResponse.json({ error: "Domaine obligatoire" }, { status: 400 });
    if (!mention) return NextResponse.json({ error: "Mention obligatoire" }, { status: 400 });

    const parcours = body.parcours?.trim() || null;
    const niveau = body.niveau?.trim() || null;
    const code = body.code?.trim() || null;

    // Vérification doublons avant insertion (insensible à la casse)
    const existing = await db
      .select()
      .from(facultes)
      .where(
        and(
          sql`LOWER(${facultes.etablissement}) = LOWER(${etablissement})`,
          sql`LOWER(${facultes.domaine}) = LOWER(${domaine})`,
          sql`LOWER(${facultes.mention}) = LOWER(${mention})`,
          parcours ? sql`LOWER(${facultes.parcours}) = LOWER(${parcours})` : sql`${facultes.parcours} IS NULL`,
          niveau ? sql`LOWER(${facultes.niveau}) = LOWER(${niveau})` : sql`${facultes.niveau} IS NULL`
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Cette faculté existe déjà (même établissement/domaine/mention/parcours/niveau)" },
        { status: 409 }
      );
    }

    const [result] = await db
      .insert(facultes)
      .values({
        etablissement,
        domaine,
        mention,
        parcours,
        niveau,
        code,
      })
      .returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "Faculté déjà existante (doublon)" }, { status: 409 });
    }
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
