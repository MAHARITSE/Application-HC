import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  getAnnees,
  getHeures,
  getEnseignants,
  getGrades,
  getStructures,
  getPaiements,
} from "@/db";
import { calcHC, calcHCNette, calcHCArrondie, calcMontantBrut, calcIRSA } from "@/lib/metier";

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
    const facultesList = getStructures();

    const heuresData = heuresList.map((h) => ({
      heure: h,
      enseignant: enseignantsList.find((e) => e.id === h.enseignantId),
      grade: h.gradeId ? gradesList.find((g) => g.id === h.gradeId) : null,
      structure: h.parcoursId ? facultesList.find((f) => f.id === h.parcoursId) : null,
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
      if (row.structure?.etablissement) cur.etabSet.add(row.structure.etablissement);
    }

    const rows = Array.from(map.values()).map((entry, idx) => {
      const hc = calcHC(entry.totalET, entry.totalED, entry.totalEP, entry.totalSout, entry.totalRech, annee?.formuleHC);
      const { hcNette, obligationAppliquee } = calcHCNette(hc, entry.derniereObligation, entry.dernierStatut);
      const hcArr = calcHCArrondie(hcNette);
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

    // Créer le workbook Excel
    const wb = XLSX.utils.book_new();

    // Feuille 1: Liste des enseignants avec calculs
    const headers = [
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
      "Taux (Ar/h)",
      "Montant Brut (Ar)",
      "IRSA (Ar)",
      "Avance (Ar)",
      "Net à Payer (Ar)",
      "RIB",
    ];

    const data = rows.map((r) => [
      r.numero,
      r.nom,
      r.prenom,
      r.nomPrenom,
      r.grade,
      r.statut,
      r.etablissement,
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
      r.rib,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 5 },   // N°
      { wch: 20 },  // Nom
      { wch: 20 },  // Prénom
      { wch: 35 },  // Nom et Prénoms
      { wch: 10 },  // Grade
      { wch: 12 },  // Statut
      { wch: 30 },  // Établissement
      { wch: 8 },   // ET
      { wch: 8 },   // ED
      { wch: 8 },   // EP
      { wch: 12 },  // Soutenance
      { wch: 12 },  // Recherche
      { wch: 10 },  // HC Brut
      { wch: 12 },  // Obligation
      { wch: 12 },  // HC Nette
      { wch: 14 },  // HC Arrondie
      { wch: 14 },  // Taux
      { wch: 18 },  // Montant Brut
      { wch: 14 },  // IRSA
      { wch: 14 },  // Avance
      { wch: 18 },  // Net à Payer
      { wch: 25 },  // RIB
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "HC Export");

    // Feuille 2: Détail par structure académique
    const detailHeaders = [
      "N°",
      "Nom et Prénoms",
      "Grade",
      "Statut",
      "Établissement",
      "Domaine",
      "Mention",
      "Parcours",
      "ET",
      "ED",
      "EP",
      "Soutenance",
      "Recherche",
      "Total",
      "Obligation",
      "HC Brut",
      "HC Nette",
      "HC Arrondie",
      "Taux",
      "Montant Brut",
      "IRSA",
      "Net",
    ];

    const detailData: any[][] = [];
    let detailIdx = 1;
    for (const row of heuresData) {
      const h = row.heure;
      const total = (h.heuresET || 0) + (h.heuresED || 0) + (h.heuresEP || 0) + (h.heuresSoutenance || 0) + (h.heuresRecherche || 0);
      const grade = row.grade?.code || "";
      const fac = row.structure;
      // row.enseignant is guaranteed to exist due to filter above
      const ens = row.enseignant!;
      const nomPrenom = `${ens.nom} ${ens.prenom || ""}`.trim();
      detailData.push([
        detailIdx++,
        nomPrenom,
        grade,
        h.statut,
        fac?.etablissement || "",
        fac?.domaine || "",
        fac?.mention || "",
        fac?.parcours || "",
        h.heuresET || 0,
        h.heuresED || 0,
        h.heuresEP || 0,
        h.heuresSoutenance || 0,
        h.heuresRecherche || 0,
        total,
        h.obligation || 0,
        "", // HC Brut calculé globalement
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    }

    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailData]);
    wsDetail["!cols"] = [
      { wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 25 },
      { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, "Détail structures");

    // Feuille 3: Résumé / Statistiques
    const statsHeaders = ["Indicateur", "Valeur"];
    const totalHcBrut = rows.reduce((s, r) => s + r.hcBrut, 0);
    const totalHcArr = rows.reduce((s, r) => s + r.hcArr, 0);
    const totalMontantBrut = rows.reduce((s, r) => s + r.montantBrut, 0);
    const totalIRSA = rows.reduce((s, r) => s + r.irsa, 0);
    const totalAvances = rows.reduce((s, r) => s + r.avance, 0);
    const totalNet = rows.reduce((s, r) => s + r.net, 0);
    const nbPermanents = rows.filter((r) => r.statut === "Permanent").length;
    const nbVacataires = rows.filter((r) => r.statut === "Vacataire").length;

    const statsData = [
      ["Année universitaire", annee?.libelle || "Toutes"],
      ["Tranche", annee?.tranche || ""],
      ["IRSA appliqué", annee?.appliquerIRSA ? `Oui (${annee?.tauxIRSA}%)` : "Non"],
      ["Plafond de paiement", annee?.plafondPaiement ? `${Number(annee.plafondPaiement).toLocaleString()} Ar` : "Aucun"],
      ["", ""],
      ["Nombre total d'enseignants", rows.length],
      ["- Permanents", nbPermanents],
      ["- Vacataires", nbVacataires],
      ["", ""],
      ["Total HC Brut", `${totalHcBrut.toFixed(2)} h`],
      ["Total HC Arrondie", `${totalHcArr} h`],
      ["", ""],
      ["Total Montant Brut", `${totalMontantBrut.toLocaleString()} Ar`],
      ["Total IRSA", `${totalIRSA.toLocaleString()} Ar`],
      ["Total Avances", `${totalAvances.toLocaleString()} Ar`],
      ["TOTAL NET À PAYER", `${totalNet.toLocaleString()} Ar`],
    ];

    const wsStats = XLSX.utils.aoa_to_sheet([statsHeaders, ...statsData]);
    wsStats["!cols"] = [{ wch: 35 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsStats, "Résumé");

    // Générer le buffer Excel
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    const filename = `hc_export_${annee?.libelle?.replace(/[^a-zA-Z0-9]/g, "_") || "all"}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("export excel error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}