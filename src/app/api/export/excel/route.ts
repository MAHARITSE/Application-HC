import { NextResponse } from "next/server";
import {
  getAnnees,
  getHeures,
  getEnseignants,
  getGrades,
  getFacultes,
  getPaiements,
} from "@/db";
import { calcHC, calcHCNette, calcMontantBrut, calcIRSA } from "@/lib/metier";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anneeIdStr = searchParams.get("anneeId");
    const anneeId = anneeIdStr ? Number(anneeIdStr) : null;

    const anneesList = getAnnees();
    const annee = anneeId ? anneesList.find((a) => a.id === anneeId) || null : null;

    let heuresList = getHeures();
    if (anneeId) {
      heuresList = heuresList.filter((h) => h.anneeId === anneeId);
    }

    const enseignantsList = getEnseignants();
    const gradesList = getGrades();
    const facultesList = getFacultes();

    const heuresData = heuresList.map((h) => ({
      heure: h,
      enseignant: enseignantsList.find((e) => e.id === h.enseignantId),
      grade: h.gradeId ? gradesList.find((g) => g.id === h.gradeId) : null,
      faculte: h.faculteId ? facultesList.find((f) => f.id === h.faculteId) : null,
    })).filter((row) => row.enseignant);

    const paiementsData = anneeId
      ? getPaiements().filter((p) => p.anneeId === anneeId)
      : getPaiements();

    // Agrégation
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
          etabSet: new Set<string>(),
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
      if (row.faculte?.etablissement) cur.etabSet.add(row.faculte.etablissement);
    }

    const rows = Array.from(map.values()).map((entry, idx) => {
      const hc = calcHC(entry.totalET, entry.totalED, entry.totalEP, entry.totalSout, entry.totalRech);
      const { hcNette, obligationAppliquee } = calcHCNette(hc, entry.derniereObligation, entry.dernierStatut);
      const hcArr = Math.floor(hcNette);
      const taux = entry.dernierGrade?.tauxHoraire || 0;
      let montantBrut = calcMontantBrut(hcArr, taux, annee?.plafondPaiement ? Number(annee.plafondPaiement) : null);
      const irsa = calcIRSA(montantBrut, annee?.tauxIRSA || 20, annee?.appliquerIRSA ?? true);
      const montantNet = montantBrut - irsa;
      const totalAvance = paiementsData
        .filter((p) => p.enseignantId === entry.enseignant.id)
        .reduce((s, p) => s + (p.montantAvance || 0), 0);

      return {
        numero: idx + 1,
        nom: entry.enseignant.nom,
        prenom: entry.enseignant.prenom || "",
        nomPrenom: `${entry.enseignant.nom} ${entry.enseignant.prenom || ""}`.trim(),
        grade: entry.dernierGrade?.code || "",
        etablissement: entry.enseignant.etablissementPrincipal || Array.from(entry.etabSet).join(", "),
        statut: entry.dernierStatut,
        et: entry.totalET,
        ed: entry.totalED,
        ep: entry.totalEP,
        soutenance: entry.totalSout,
        recherche: entry.totalRech,
        hcBrut: hc,
        obligation: obligationAppliquee,
        hcNette,
        hcArr,
        taux,
        montantBrut,
        irsa,
        avance: totalAvance,
        net: montantNet - totalAvance,
        rib: entry.enseignant.rib || "",
      };
    });

    // Génère CSV
    const csvHeader = [
      "N°",
      "Nom",
      "Prénom",
      "Nom et Prénoms",
      "Grade",
      "Statut",
      "Établissement",
      "ET",
      "ED",
      "EP",
      "Soutenance",
      "Recherche",
      "HC Brut",
      "Obligation",
      "HC Nette",
      "HC Arrondie",
      "Taux",
      "Montant Brut",
      "IRSA",
      "Avance",
      "Net à Payer",
      "RIB",
    ].join(";");

    const csvRows = rows
      .map((r) =>
        [
          r.numero,
          `"${r.nom}"`,
          `"${r.prenom}"`,
          `"${r.nomPrenom}"`,
          r.grade,
          r.statut,
          `"${r.etablissement}"`,
          r.et,
          r.ed,
          r.ep,
          r.soutenance,
          r.recherche,
          r.hcBrut,
          r.obligation,
          r.hcNette,
          r.hcArr,
          r.taux,
          r.montantBrut,
          r.irsa,
          r.avance,
          r.net,
          `"${r.rib}"`,
        ].join(";")
      )
      .join("\n");

    const csv = `${csvHeader}\n${csvRows}`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hc_export_${annee?.libelle || "all"}_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("export excel error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
