import { NextResponse } from "next/server";

// Cette table n'existe plus selon prompt.md
// Obligation est désormais stockée dans heures.obligation
// On garde l'endpoint pour compatibilité mais il indique la migration

export async function GET() {
  return NextResponse.json(
    {
      message: "Déprécié: obligation est maintenant dans heures.obligation (défaut 125h, 0 pour vacataires)",
      data: [],
    },
    { status: 200 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Déprécié",
      message: "Utilisez POST /api/heures avec champ obligation. L'obligation est stockée dans heures selon prompt.md",
    },
    { status: 410 }
  );
}
