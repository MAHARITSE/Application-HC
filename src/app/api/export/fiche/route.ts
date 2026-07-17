import { NextResponse } from "next/server";
import {
  getEnseignants,
  getGrades,
  getHeures,
  getFacultes,
  getAnnees,
  getPaiements,
} from "@/db";
import { calcHC, calcHCNette, calcMontantBrut, calcIRSA, nombreEnLettres } from "@/lib/metier";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enseignantId = searchParams.get("enseignantId");
    const anneeId = searchParams.get("anneeId");
    const numeroEtat = searchParams.get("numeroEtat") || "0001";

    if (!enseignantId || !anneeId) {
      return NextResponse.json({ error: "enseignantId and anneeId required" }, { status: 400 });
    }

    const eid = Number(enseignantId);
    const aid = Number(anneeId);

    const ens = getEnseignants().find((e) => e.id === eid);
    if (!ens) return NextResponse.json({ error: "Enseignant not found" }, { status: 404 });

    const annee = getAnnees().find((a) => a.id === aid);
    if (!annee) return NextResponse.json({ error: "Année not found" }, { status: 404 });

    const heuresData = getHeures()
      .filter((h) => h.enseignantId === eid && h.anneeId === aid)
      .map((h) => ({
        heures: h,
        faculte: h.faculteId ? getFacultes().find((f) => f.id === h.faculteId) : null,
        grade: h.gradeId ? getGrades().find((g) => g.id === h.gradeId) : null,
      }));

    if (heuresData.length === 0) {
      return NextResponse.json({ error: "Aucune heure pour cet enseignant cette année" }, { status: 404 });
    }

    const paies = getPaiements().filter((p) => p.enseignantId === eid && p.anneeId === aid);

    let totalET = 0, totalED = 0, totalEP = 0, totalSout = 0, totalRech = 0;

    const detailsParFaculte: Record<string, any[]> = {};

    let refGrade: any = null;
    let refStatut = "Vacataire";
    let refObligation = 0;

    const sorted = [...heuresData].sort((a, b) => a.heures.id - b.heures.id);

    for (const h of sorted) {
      const et = h.heures.heuresET || 0;
      const ed = h.heures.heuresED || 0;
      const ep = h.heures.heuresEP || 0;
      const sout = h.heures.heuresSoutenance || 0;
      const rech = h.heures.heuresRecherche || 0;

      totalET += et;
      totalED += ed;
      totalEP += ep;
      totalSout += sout;
      totalRech += rech;

      if (h.grade) refGrade = h.grade;
      if (h.heures.statut) refStatut = h.heures.statut;
      if (h.heures.obligation != null) refObligation = h.heures.obligation;

      const etabKey = h.faculte?.etablissement || "Non spécifié";
      if (!detailsParFaculte[etabKey]) detailsParFaculte[etabKey] = [];
      detailsParFaculte[etabKey].push({
        etablissement: h.faculte?.etablissement || etabKey,
        domaine: h.faculte?.domaine || "",
        mention: h.faculte?.mention || "",
        parcours: h.faculte?.parcours || "",
        et,
        ed,
        ep,
        sout,
        rech,
      });
    }

    const hcBrut = calcHC(totalET, totalED, totalEP, totalSout, totalRech);
    const obligationAppliquee = refStatut === "Permanent" ? refObligation : 0;
    const { hcNette } = calcHCNette(hcBrut, refObligation, refStatut);
    const hcArrondi = Math.floor(hcNette);
    const taux = refGrade?.tauxHoraire || 0;

    let montantBrut = calcMontantBrut(hcArrondi, taux);
    if (annee.plafondPaiement && montantBrut > Number(annee.plafondPaiement)) {
      montantBrut = Number(annee.plafondPaiement);
    }

    const appliquerIRSA = annee.appliquerIRSA ?? true;
    const tauxIRSA = annee.tauxIRSA ?? 20;
    const montantIRSA = calcIRSA(montantBrut, tauxIRSA, appliquerIRSA);
    const montantNet = montantBrut - montantIRSA;

    const totalAvance = paies.reduce((s, p) => s + (p.montantAvance || 0), 0);
    const totalPaye = paies.reduce((s, p) => s + (p.montantPaye || 0), 0);
    const netAPayer = montantNet - totalAvance;

    return NextResponse.json({
      numeroEtat,
      annee: annee.libelle,
      tranche: annee.tranche,
      enseignant: {
        nom: ens.nom,
        prenom: ens.prenom,
        nomPrenom: `${ens.nom}${ens.prenom ? " " + ens.prenom : ""}`,
        cin: ens.cin,
        dateCIN: ens.dateCIN,
        dateNaissance: ens.dateNaissance,
        lieuNaissance: ens.lieuNaissance,
        nationalite: ens.nationalite,
        adresse: ens.adresse,
        telephone: ens.telephone,
        email: ens.email,
        rib: ens.rib,
        specialite: ens.specialite,
        etablissementPrincipal: ens.etablissementPrincipal,
        dateRecrutement: ens.dateRecrutement,
      },
      grade: refGrade
        ? {
            code: refGrade.code,
            libelle: refGrade.libelle,
            taux: refGrade.tauxHoraire,
          }
        : null,
      statut: refStatut,
      detailsParFaculte,
      totaux: {
        et: totalET,
        ed: totalED,
        ep: totalEP,
        soutenance: totalSout,
        recherche: totalRech,
        hcBrut,
        obligation: obligationAppliquee,
        obligationSaisie: refObligation,
        exempte: refObligation === 0,
        hcNette,
        hcArrondi,
      },
      calculs: {
        taux,
        montantBrut,
        plafondApplique: annee.plafondPaiement ? Number(annee.plafondPaiement) : null,
        appliquerIRSA,
        tauxIRSA,
        montantIRSA,
        montantNet,
        totalAvance,
        totalPaye,
        netAPayer,
        netEnLettres: nombreEnLettres(netAPayer) + " ARIARY",
      },
      paiements: paies,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("fiche error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
