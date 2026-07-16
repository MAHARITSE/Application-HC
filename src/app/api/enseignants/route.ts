import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants } from "@/db/schema";
import { ilike, or, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";

  try {
    let query;
    if (search) {
      query = db
        .select()
        .from(enseignants)
        .where(
          or(
            ilike(enseignants.nom, `%${search}%`),
            ilike(enseignants.prenoms, `%${search}%`),
            ilike(enseignants.etablissement, `%${search}%`)
          )
        )
        .orderBy(desc(enseignants.updatedAt));
    } else {
      query = db
        .select()
        .from(enseignants)
        .orderBy(desc(enseignants.updatedAt));
    }

    const results = await query;
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching enseignants:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des enseignants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db
      .insert(enseignants)
      .values({
        nom: body.nom,
        prenoms: body.prenoms,
        grade: body.grade,
        etablissement: body.etablissement,
        statut: body.statut,
        heuresET: String(body.heuresET || 0),
        heuresED: String(body.heuresED || 0),
        heuresEP: String(body.heuresEP || 0),
        heuresSoutenance: String(body.heuresSoutenance || 0),
        heuresRecherche: String(body.heuresRecherche || 0),
        rib: body.rib || "",
        avance: String(body.avance || 0),
        dateAvance: body.dateAvance || "",
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating enseignant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'enseignant" },
      { status: 500 }
    );
  }
}
