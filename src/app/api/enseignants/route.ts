import { NextResponse } from "next/server";
import {
  getEnseignants,
  saveEnseignants,
  getHeures,
  getGrades,
  getPaiements,
  getFacultes,
  createEnseignant,
  updateEnseignant,
  deleteEnseignant,
} from "@/db";
import { toUpperCase, toTitleCase } from "@/lib/formatters";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const anneeId = searchParams.get("anneeId");

    let baseEnseignants = getEnseignants();

    // Recherche simple côté serveur
    if (search) {
      const s = search.toLowerCase();
      baseEnseignants = baseEnseignants.filter((e) =>
        (e.nom || "").toLowerCase().includes(s) ||
        (e.prenom || "").toLowerCase().includes(s) ||
        (e.cin || "").toLowerCase().includes(s) ||
        (e.etablissementPrincipal || "").toLowerCase().includes(s)
      );
    }

    // Sans anneeId => liste complète de TOUS les enseignants
    if (!anneeId) {
      const mapped = baseEnseignants
        .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
        .map((e) => ({
          ...e,
          nomPrenom: `${e.nom}${e.prenom ? " " + e.prenom : ""}`.trim(),
        }));
      return NextResponse.json(mapped);
    }

    // Avec anneeId => agrégation des heures + paiements
    const anneeIdNum = Number(anneeId);

    const allHeures = getHeures().filter((h) => h.anneeId === anneeIdNum);
    const allGrades = getGrades();
    const allFacultes = getFacultes();
    const allPaiements = getPaiements().filter((p) => p.anneeId === anneeIdNum);

    // Paiements groupés par enseignant (avances, payé, % tranche cumulé)
    const paiementsMap = new Map<
      number,
      { totalAvance: number; totalPaye: number; pourcentageTranche: number; nbPaiements: number }
    >();
    for (const p of allPaiements) {
      const cur = paiementsMap.get(p.enseignantId) || {
        totalAvance: 0,
        totalPaye: 0,
        pourcentageTranche: 0,
        nbPaiements: 0,
      };
      cur.totalAvance += p.montantAvance || 0;
      cur.totalPaye += p.montantPaye || 0;
      cur.pourcentageTranche += p.pourcentageTranche || 0;
      cur.nbPaiements += 1;
      paiementsMap.set(p.enseignantId, cur);
    }

    // Grouper heures par enseignant
    const map = new Map<
      number,
      {
        total_et: number;
        total_ed: number;
        total_ep: number;
        total_soutenance: number;
        total_recherche: number;
        dernierGrade: any;
        dernierStatut: string | null;
        derniereObligation: number;
        dernierFaculte: any;
      }
    >();

    for (const h of allHeures) {
      const eid = h.enseignantId;
      const cur = map.get(eid) || {
        total_et: 0,
        total_ed: 0,
        total_ep: 0,
        total_soutenance: 0,
        total_recherche: 0,
        dernierGrade: null,
        dernierStatut: null,
        derniereObligation: 125,
        dernierFaculte: null,
      };

      cur.total_et += h.heuresET || 0;
      cur.total_ed += h.heuresED || 0;
      cur.total_ep += h.heuresEP || 0;
      cur.total_soutenance += h.heuresSoutenance || 0;
      cur.total_recherche += h.heuresRecherche || 0;

      const grade = allGrades.find((g) => g.id === h.gradeId) || cur.dernierGrade;
      cur.dernierGrade = grade || cur.dernierGrade;
      cur.dernierStatut = h.statut || cur.dernierStatut;
      cur.derniereObligation = h.obligation ?? cur.derniereObligation;

      const fac = h.faculteId ? allFacultes.find((f) => f.id === h.faculteId) : null;
      cur.dernierFaculte = fac || cur.dernierFaculte;

      map.set(eid, cur);
    }

    // Filtrer les enseignants qui ont des heures cette année
    const filteredEnseignants = baseEnseignants.filter((e) => map.has(e.id));

    const result = filteredEnseignants.map((e) => {
      const agg = map.get(e.id)!;
      const paie = paiementsMap.get(e.id);

      return {
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        nomPrenom: `${e.nom}${e.prenom ? " " + e.prenom : ""}`.trim(),
        cin: e.cin,
        dateCIN: e.dateCIN,
        dateNaissance: e.dateNaissance,
        lieuNaissance: e.lieuNaissance,
        nationalite: e.nationalite,
        adresse: e.adresse,
        telephone: e.telephone,
        email: e.email,
        rib: e.rib,
        specialite: e.specialite,
        etablissementPrincipal: e.etablissementPrincipal,
        dateRecrutement: e.dateRecrutement,
        // Grade/statut stockés dans heures (historique)
        gradeCode: agg.dernierGrade?.code || null,
        gradeLibelle: agg.dernierGrade?.libelle || null,
        gradeTaux: agg.dernierGrade?.tauxHoraire || null,
        gradeId: agg.dernierGrade?.id || null,
        statut: agg.dernierStatut || "Vacataire",
        faculteEtablissement: agg.dernierFaculte?.etablissement || e.etablissementPrincipal,
        faculteDomaine: agg.dernierFaculte?.domaine || null,
        faculteMention: agg.dernierFaculte?.mention || null,
        // Totaux heures
        total_et: agg.total_et,
        total_ed: agg.total_ed,
        total_ep: agg.total_ep,
        total_soutenance: agg.total_soutenance,
        total_recherche: agg.total_recherche,
        total_avance: paie ? paie.totalAvance : 0,
        total_paye: paie ? paie.totalPaye : 0,
        pourcentage_tranche: paie ? Math.min(paie.pourcentageTranche, 100) : 0,
        nb_paiements: paie ? paie.nbPaiements : 0,
        obligation: agg.derniereObligation,
        obligation_custom: agg.derniereObligation,
        exempte: agg.derniereObligation === 0,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/enseignants error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nomRaw = body.nom || body.nomPrenom || "";
    if (!nomRaw?.trim()) {
      return NextResponse.json({ error: "Nom obligatoire (MAJUSCULES)" }, { status: 400 });
    }

    let nom = "";
    let prenom: string | null = null;

    if (body.nom) {
      nom = toUpperCase(body.nom);
      prenom = body.prenom ? toTitleCase(body.prenom) : null;
    } else if (body.nomPrenom) {
      const parts = body.nomPrenom.trim().split(/\s+/);
      if (parts.length === 1) {
        nom = toUpperCase(parts[0]);
      } else {
        nom = toUpperCase(parts[0]);
        prenom = toTitleCase(parts.slice(1).join(" "));
      }
    }

    const adresse = body.adresse ? toTitleCase(body.adresse) : null;

    // Vérification anti-répétition : nom + prenom + cin
    const existing = getEnseignants();
    const cinNorm = (body.cin || "").trim().replace(/\s+/g, "");
    const duplicate = existing.find((e) => {
      const eNom = (e.nom || "").toUpperCase();
      const ePrenom = (e.prenom || "").toUpperCase();
      const eCin = (e.cin || "").trim().replace(/\s+/g, "");
      const n = nom.toUpperCase();
      const p = (prenom || "").toUpperCase();
      return eNom === n && ePrenom === p && (cinNorm ? eCin === cinNorm : false);
    });
    if (duplicate) {
      return NextResponse.json({ error: "Un enseignant avec ce nom, prénom et CIN existe déjà (id: " + duplicate.id + ")" }, { status: 409 });
    }

    const newEns = createEnseignant({
      nom,
      prenom,
      cin: body.cin?.trim() || null,
      dateCIN: body.dateCIN || body.dateCin || null,
      dateNaissance: body.dateNaissance || null,
      lieuNaissance: body.lieuNaissance?.trim() || null,
      nationalite: body.nationalite?.trim() || "Malagasy",
      adresse,
      telephone: body.telephone?.trim() || null,
      email: body.email?.trim() || null,
      rib: body.rib?.trim() || null,
      specialite: body.specialite?.trim() || null,
      etablissementPrincipal: body.etablissementPrincipal?.trim() || null,
      dateRecrutement: body.dateRecrutement || null,
      gradeId: body.gradeId ? Number(body.gradeId) : null,
    });

    return NextResponse.json(newEns);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
