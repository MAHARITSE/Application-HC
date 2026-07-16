import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await db
      .select()
      .from(enseignants)
      .where(eq(enseignants.id, parseInt(id)));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Enseignant non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching enseignant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await db
      .update(enseignants)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(enseignants.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Enseignant non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating enseignant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await db
      .delete(enseignants)
      .where(eq(enseignants.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Enseignant non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enseignant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
