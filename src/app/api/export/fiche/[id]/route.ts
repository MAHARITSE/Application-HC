import { NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants, grades, heures, facultes, annees, paiements } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calcHC, calcHCNette, calcMontantBrut, calcIRSA, nombreEnLettres } from "@/lib/metier";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eid = Number(id);
    // On prend la dernière année active par défaut si pas fournie? Ici on exige via query? Mais pour compat on prend annee active
    const [anneeActive] = await db.select().from(annees).where(eq(annees.active, true)).limit(1);
    const anneeId = anneeActive?.id;
    if (!anneeId) {
      return NextResponse.json({ error: "Aucune année active" }, { status: 404 });
    }

    const [ens] = await db.select().from(enseignants).where(eq(enseignants.id, eid));
    if (!ens) return NextResponse.json({ error: "Enseignant not found" }, { status: 404 });

    const heuresData = await db
      .select({ heures: heures, faculte: facultes, grade: grades })
      .from(heures)
      .leftJoin(facultes, eq(heures.faculteId, facultes.id))
      .leftJoin(grades, eq(heures.gradeId, grades.id))
      .where(and(eq(heures.enseignantId, eid), eq(heures.anneeId, anneeId)));

    const paies = await db.select().from(paiements).where(and(eq(paiements.enseignantId, eid), eq(paiements.anneeId, anneeId)));

    if (heuresData.length === 0) {
      return NextResponse.json({ error: "Aucune heure" }, { status: 404 });
    }

    let totalET = 0,
      totalED = 0,
      totalEP = 0,
      totalSout = 0,
      totalRech = 0;
    let refGrade: any = null;
    let refStatut = "Vacataire";
    let refObligation = 0;
    const detailsParFaculte: Record<string, any[]> = {};

    const sorted = [...heuresData].sort((a, b) => a.heures.id - b.heures.id);
    for (const h of sorted) {
      totalET += h.heures.heuresET || 0;
      totalED += h.heures.heuresED || 0;
      totalEP += h.heures.heuresEP || 0;
      totalSout += h.heures.heuresSoutenance || 0;
      totalRech += h.heures.heuresRecherche || 0;
      if (h.grade) refGrade = h.grade;
      if (h.heures.statut) refStatut = h.heures.statut;
      if (h.heures.obligation != null) refObligation = h.heures.obligation;

      const key = h.faculte?.etablissement || "Non spécifié";
      if (!detailsParFaculte[key]) detailsParFaculte[key] = [];
      detailsParFaculte[key].push({
        etablissement: h.faculte?.etablissement || key,
        domaine: h.faculte?.domaine || "",
        mention: h.faculte?.mention || "",
        parcours: h.faculte?.parcours || "",
        et: h.heures.heuresET || 0,
        ed: h.heures.heuresED || 0,
        ep: h.heures.heuresEP || 0,
        sout: h.heures.heuresSoutenance || 0,
        rech: h.heures.heuresRecherche || 0,
      });
    }

    const hcBrut = calcHC(totalET, totalED, totalEP, totalSout, totalRech);
    const { hcNette } = calcHCNette(hcBrut, refObligation, refStatut);
    const hcArrondi = Math.floor(hcNette);
    const taux = refGrade?.tauxHoraire || 0;
    let montantBrut = calcMontantBrut(hcArrondi, taux);
    if (anneeActive.plafondPaiement && montantBrut > Number(anneeActive.plafondPaiement)) montantBrut = Number(anneeActive.plafondPaiement);
    const montantIRSA = calcIRSA(montantBrut, anneeActive.tauxIRSA || 20, anneeActive.appliquerIRSA ?? true);
    const montantNet = montantBrut - montantIRSA;
    const totalAvance = paies.reduce((s, p) => s + (p.montantAvance || 0), 0);
    const netAPayer = montantNet - totalAvance;

    return NextResponse.json({
      numeroEtat: "0001",
      annee: anneeActive.libelle,
      tranche: anneeActive.tranche,
      enseignant: {
        nom: ens.nom,
        prenom: ens.prenom,
        nomPrenom: `${ens.nom} ${ens.prenom || ""}`.trim(),
        cin: ens.cin,
        statut: refStatut,
        rib: ens.rib,
        telephone: ens.telephone,
        email: ens.email,
        etablissementPrincipal: ens.etablissementPrincipal,
        specialite: ens.specialite,
      },
      grade: refGrade ? { code: refGrade.code, libelle: refGrade.libelle, taux: refGrade.tauxHoraire } : null,
      statut: refStatut,
      detailsParFaculte,
      totaux: {
        et: totalET,
        ed: totalED,
        ep: totalEP,
        soutenance: totalSout,
        recherche: totalRech,
        hcBrut,
        obligation: refStatut === "Permanent" ? refObligation : 0,
        hcNette,
        hcArrondi,
      },
      calculs: {
        taux,
        montantBrut,
        appliquerIRSA: anneeActive.appliquerIRSA,
        tauxIRSA: anneeActive.tauxIRSA,
        montantIRSA,
        montantNet,
        totalAvance,
        netAPayer,
        netEnLettres: nombreEnLettres(netAPayer) + " ARIARY",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
