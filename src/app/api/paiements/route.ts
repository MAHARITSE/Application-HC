import { NextResponse } from "next/server";
import { getPaiements, createPaiement, deletePaiement } from "@/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enseignantId = searchParams.get("enseignantId");
    const anneeId = searchParams.get("anneeId");

    let paiements = getPaiements();

    if (enseignantId) {
      paiements = paiements.filter((p) => p.enseignantId === Number(enseignantId));
    }
    if (anneeId) {
      paiements = paiements.filter((p) => p.anneeId === Number(anneeId));
    }

    paiements.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(paiements);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.enseignantId || !body.anneeId) {
      return NextResponse.json({ error: "enseignantId et anneeId requis" }, { status: 400 });
    }

    const newPaiement = createPaiement({
      enseignantId: Number(body.enseignantId),
      anneeId: Number(body.anneeId),
      montantAvance: body.montantAvance != null ? Number(body.montantAvance) : 0,
      dateAvance: body.dateAvance || null,
      pourcentageTranche: body.pourcentageTranche != null ? Number(body.pourcentageTranche) : 100,
      montantPaye: body.montantPaye != null ? Number(body.montantPaye) : 0,
      datePaiement: body.datePaiement || null,
      reference: body.reference?.trim() || null,
      statut: body.statut || (body.pourcentageTranche >= 100 ? "Payé" : "Partiel"),
    });

    return NextResponse.json(newPaiement);
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

    deletePaiement(Number(id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
