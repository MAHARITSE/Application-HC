import { NextResponse } from "next/server";
import {
  getStructures,
  createStructure,
  updateStructure,
  deleteStructure,
  getEtablissements,
  getDomaines,
  createEtablissement,
  createDomaine,
  createMention,
} from "@/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const field = searchParams.get("field");
    const distinct = searchParams.get("distinct") === "true";

    const level = searchParams.get("level");
    if (level === "etablissements") return NextResponse.json(getEtablissements().sort((a, b) => a.etablissement.localeCompare(b.etablissement)));
    if (level === "domaines") {
      const etablissementId = Number(searchParams.get("etablissementId"));
      return NextResponse.json(getDomaines().filter((item) => !etablissementId || item.etablissementId === etablissementId).sort((a, b) => a.domaine.localeCompare(b.domaine)));
    }

    let facultes = getStructures();

    // Autocomplete distinct values
    if (field && distinct) {
      const allowed = ["etablissement", "domaine", "mention", "parcours"] as const;
      if (!allowed.includes(field as any)) {
        return NextResponse.json({ error: "Champ invalide" }, { status: 400 });
      }

      const set = new Set<string>();
      for (const f of facultes) {
        const val = (f as any)[field];
        if (val && (!q || val.toLowerCase().includes(q.toLowerCase()))) {
          set.add(val);
        }
      }
      const values = Array.from(set).sort().slice(0, 50);
      return NextResponse.json(values);
    }

    if (q) {
      const lowerQ = q.toLowerCase();
      facultes = facultes.filter((f) =>
        (f.etablissement || "").toLowerCase().includes(lowerQ) ||
        (f.domaine || "").toLowerCase().includes(lowerQ) ||
        (f.mention || "").toLowerCase().includes(lowerQ) ||
        (f.parcours || "").toLowerCase().includes(lowerQ)
      );
    }

    return NextResponse.json(
      facultes.sort((a, b) => (a.etablissement || "").localeCompare(b.etablissement || ""))
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Gestion normalisée, utilisée par les trois onglets de la structure.
    if (body.level === "etablissement") {
      if (!body.etablissement?.trim()) return NextResponse.json({ error: "Établissement obligatoire" }, { status: 400 });
      return NextResponse.json(createEtablissement(body.etablissement));
    }
    if (body.level === "domaine") {
      if (!body.etablissementId || !body.domaine?.trim()) return NextResponse.json({ error: "Établissement et domaine obligatoires" }, { status: 400 });
      return NextResponse.json(createDomaine(Number(body.etablissementId), body.domaine));
    }
    if (body.level === "mention") {
      if (!body.domaineId || !body.mention?.trim()) return NextResponse.json({ error: "Établissement, domaine et mention obligatoires" }, { status: 400 });
      return NextResponse.json(createMention(Number(body.domaineId), body.mention, body.parcours || null));
    }

    const etablissement = body.etablissement?.trim();
    const domaine = body.domaine?.trim();
    const mention = body.mention?.trim();

    if (!etablissement) return NextResponse.json({ error: "Établissement obligatoire" }, { status: 400 });
    if (!domaine) return NextResponse.json({ error: "Domaine obligatoire" }, { status: 400 });
    if (!mention) return NextResponse.json({ error: "Mention obligatoire" }, { status: 400 });

    const parcours = body.parcours?.trim() || null;

    const existing = getStructures().find((f) =>
      (f.etablissement || "").toLowerCase() === etablissement.toLowerCase() &&
      (f.domaine || "").toLowerCase() === domaine.toLowerCase() &&
      (f.mention || "").toLowerCase() === mention.toLowerCase() &&
      (f.parcours || "").toLowerCase() === (parcours || "").toLowerCase()
    );

    if (existing) {
      return NextResponse.json(
        { error: "Cette structure existe déjà (même établissement/domaine/mention/parcours)" },
        { status: 409 }
      );
    }

    const newFac = createStructure({
      etablissement,
      domaine,
      mention,
      parcours,
    });

    return NextResponse.json(newFac);
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

    deleteStructure(Number(id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const etablissement = body.etablissement?.trim();
    const domaine = body.domaine?.trim();
    const mention = body.mention?.trim();

    if (!etablissement) return NextResponse.json({ error: "Établissement obligatoire" }, { status: 400 });
    if (!domaine) return NextResponse.json({ error: "Domaine obligatoire" }, { status: 400 });
    if (!mention) return NextResponse.json({ error: "Mention obligatoire" }, { status: 400 });

    const parcours = body.parcours?.trim() || null;

    const existing = getStructures().find((f) =>
      f.id !== Number(body.id) &&
      (f.etablissement || "").toLowerCase() === etablissement.toLowerCase() &&
      (f.domaine || "").toLowerCase() === domaine.toLowerCase() &&
      (f.mention || "").toLowerCase() === mention.toLowerCase() &&
      (f.parcours || "").toLowerCase() === (parcours || "").toLowerCase()
    );

    if (existing) {
      return NextResponse.json({ error: "Cette structure existe déjà" }, { status: 409 });
    }

    const updated = updateStructure(Number(body.id), { etablissement, domaine, mention, parcours });
    if (!updated) return NextResponse.json({ error: "Structure académique non trouvée" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
