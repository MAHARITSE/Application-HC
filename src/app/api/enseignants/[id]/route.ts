import { NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toUpperCase, toTitleCase } from "@/lib/formatters";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [result] = await db.select().from(enseignants).where(eq(enseignants.id, Number(id)));
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const nom = body.nom ? toUpperCase(body.nom) : body.nomPrenom ? toUpperCase(body.nomPrenom.split(" ")[0]) : undefined;
    const prenom = body.prenom != null ? (body.prenom ? toTitleCase(body.prenom) : null) : undefined;
    const adresse = body.adresse != null ? (body.adresse ? toTitleCase(body.adresse) : null) : undefined;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (nom) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (body.cin !== undefined) updateData.cin = body.cin?.trim() || null;
    if (body.dateCIN !== undefined) updateData.dateCIN = body.dateCIN || null;
    if (body.dateCin !== undefined) updateData.dateCIN = body.dateCin || null; // compat
    if (body.dateNaissance !== undefined) updateData.dateNaissance = body.dateNaissance || null;
    if (body.lieuNaissance !== undefined) updateData.lieuNaissance = body.lieuNaissance?.trim() || null;
    if (body.nationalite !== undefined) updateData.nationalite = body.nationalite?.trim() || "Malagasy";
    if (adresse !== undefined) updateData.adresse = adresse;
    if (body.telephone !== undefined) updateData.telephone = body.telephone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.rib !== undefined) updateData.rib = body.rib?.trim() || null;
    if (body.specialite !== undefined) updateData.specialite = body.specialite?.trim() || null;
    if (body.etablissementPrincipal !== undefined) updateData.etablissementPrincipal = body.etablissementPrincipal?.trim() || null;
    if (body.dateRecrutement !== undefined) updateData.dateRecrutement = body.dateRecrutement || null;

    // Support ancien champ nomPrenom pour compat
    if (body.nomPrenom && !body.nom) {
      const parts = body.nomPrenom.trim().split(/\s+/);
      if (parts.length > 1) {
        updateData.nom = toUpperCase(parts[0]);
        if (body.prenom === undefined) {
          updateData.prenom = toTitleCase(parts.slice(1).join(" "));
        }
      } else {
        updateData.nom = toUpperCase(body.nomPrenom);
      }
    }

    const [result] = await db.update(enseignants).set(updateData).where(eq(enseignants.id, Number(id))).returning();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(enseignants).where(eq(enseignants.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
