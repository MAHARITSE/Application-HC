import { NextResponse } from "next/server";
import {
  getAnnees,
  createAnnee,
  updateAnnee,
} from "@/db";

export async function GET() {
  try {
    const result = getAnnees().sort((a, b) => b.libelle.localeCompare(a.libelle));
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.libelle?.trim()) {
      return NextResponse.json({ error: "Libellé requis (ex: 2024-2025)" }, { status: 400 });
    }
    const libelle = body.libelle.trim();

    const newAnnee = createAnnee({
      libelle,
      tranche: body.tranche || "Première tranche",
      active: body.active ?? false,
      appliquerIRSA: body.appliquerIRSA ?? true,
      tauxIRSA: body.tauxIRSA ?? 20,
      plafondPaiement: body.plafondPaiement ? String(body.plafondPaiement) : null,
      formuleHC: body.formuleHC?.trim() || "ET*5/3+ED+EP/2+soutenance+recherche",
    });

    return NextResponse.json(newAnnee);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updated = updateAnnee(Number(body.id), {
      libelle: body.libelle?.trim(),
      tranche: body.tranche,
      active: body.active,
      appliquerIRSA: body.appliquerIRSA,
      tauxIRSA: body.tauxIRSA,
      plafondPaiement: body.plafondPaiement ? String(body.plafondPaiement) : null,
      formuleHC: body.formuleHC?.trim() || "ET*5/3+ED+EP/2+soutenance+recherche",
    });

    if (!updated) {
      return NextResponse.json({ error: "Année non trouvée" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
