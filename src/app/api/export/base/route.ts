import { NextRequest, NextResponse } from "next/server";
import {
  getAnnees,
  getHeures,
  getEnseignants,
  getGrades,
  getStructures,
  getPaiements,
} from "@/db";
import { calcHC, calcHCNette, calcHCArrondie, calcMontantBrut, calcIRSA } from "@/lib/metier";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anneeId = Number(searchParams.get("anneeId"));
  if (!anneeId) {
    return NextResponse.json({ error: "anneeId requis" }, { status: 400 });
  }

  const annees = getAnnees();
  const annee = annees.find((a) => a.id === anneeId);

  const heuresData = getHeures()
    .filter((h) => h.anneeId === anneeId)
    .map((h) => ({
      heure: h,
      enseignant: getEnseignants().find((e) => e.id === h.enseignantId),
      grade: h.gradeId ? getGrades().find((g) => g.id === h.gradeId) : null,
      structure: h.parcoursId ? getStructures().find((f) => f.id === h.parcoursId) : null,
    }))
    .filter((row) => row.enseignant); // only valid

  const paiementsData = getPaiements().filter((p) => p.anneeId === anneeId);

  // Aggregation par enseignant
  const map = new Map<number, any>();

  for (const row of heuresData) {
    const eid = row.enseignant!.id;
    if (!map.has(eid)) {
      map.set(eid, {
        enseignant: row.enseignant,
        totalET: 0,
        totalED: 0,
        totalEP: 0,
        totalSout: 0,
        totalRech: 0,
        dernierGrade: null,
        dernierStatut: "Vacataire",
        derniereObligation: 125,
        structures: new Set<string>(),
      });
    }
    const cur = map.get(eid);
    cur.totalET += row.heure.heuresET || 0;
    cur.totalED += row.heure.heuresED || 0;
    cur.totalEP += row.heure.heuresEP || 0;
    cur.totalSout += row.heure.heuresSoutenance || 0;
    cur.totalRech += row.heure.heuresRecherche || 0;
    if (row.grade) cur.dernierGrade = row.grade;
    if (row.heure.statut) cur.dernierStatut = row.heure.statut;
    if (row.heure.obligation != null) cur.derniereObligation = row.heure.obligation;
    if (row.structure?.etablissement) cur.structures.add(row.structure.etablissement);
  }

  const data = Array.from(map.values()).map((entry, idx) => {
    const hc = calcHC(entry.totalET, entry.totalED, entry.totalEP, entry.totalSout, entry.totalRech, annee?.formuleHC);
    const { hcNette } = calcHCNette(hc, entry.derniereObligation, entry.dernierStatut);
    const hcArr = calcHCArrondie(hcNette);
    const taux = entry.dernierGrade?.tauxHoraire || 0;
    let montantBrut = calcMontantBrut(hcArr, taux);
    if (annee?.plafondPaiement && montantBrut > Number(annee.plafondPaiement)) {
      montantBrut = Number(annee.plafondPaiement);
    }
    const irsa = calcIRSA(montantBrut, annee?.tauxIRSA || 20, annee?.appliquerIRSA ?? true);
    const montantNet = montantBrut - irsa;
    const totalAvance = paiementsData
      .filter((p) => p.enseignantId === entry.enseignant.id)
      .reduce((s, p) => s + (p.montantAvance || 0), 0);

    return {
      numero: idx + 1,
      id: entry.enseignant.id,
      nom: entry.enseignant.nom,
      prenom: entry.enseignant.prenom,
      nomPrenom: `${entry.enseignant.nom} ${entry.enseignant.prenom || ""}`.trim(),
      cin: entry.enseignant.cin,
      statut: entry.dernierStatut,
      grade: entry.dernierGrade?.code || "",
      gradeLibelle: entry.dernierGrade?.libelle || "",
      taux,
      etablissement: entry.enseignant.etablissementPrincipal || Array.from(entry.structures).join(", "),
      et: entry.totalET,
      ed: entry.totalED,
      ep: entry.totalEP,
      soutenance: entry.totalSout,
      recherche: entry.totalRech,
      hcBrut: hc,
      obligation: entry.dernierStatut === "Permanent" ? entry.derniereObligation : 0,
      hcNette,
      hcArrondi: hcArr,
      montantBrut,
      irsa,
      montantNet,
      avance: totalAvance,
      netPayer: montantNet - totalAvance,
      rib: entry.enseignant.rib,
      telephone: entry.enseignant.telephone,
      email: entry.enseignant.email,
    };
  });

  return NextResponse.json({
    annee: annee?.libelle || "",
    tranche: annee?.tranche || "",
    appliquerIRSA: annee?.appliquerIRSA,
    tauxIRSA: annee?.tauxIRSA,
    data,
  });
}
