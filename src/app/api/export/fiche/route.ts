import { NextResponse } from "next/server";
import { db } from "@/db";
import { enseignants, grades, heures, facultes, annees, obligations, paiements } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

    // Get enseignant with grade
    const [ens] = await db
      .select({
        enseignant: enseignants,
        grade: grades,
      })
      .from(enseignants)
      .leftJoin(grades, eq(enseignants.gradeId, grades.id))
      .where(eq(enseignants.id, Number(enseignantId)));

    if (!ens) return NextResponse.json({ error: "Enseignant not found" }, { status: 404 });

    // Get année
    const [annee] = await db.select().from(annees).where(eq(annees.id, Number(anneeId)));
    if (!annee) return NextResponse.json({ error: "Année not found" }, { status: 404 });

    // Get heures with facultés
    const heuresData = await db
      .select({
        heures: heures,
        faculte: facultes,
      })
      .from(heures)
      .leftJoin(facultes, eq(heures.faculteId, facultes.id))
      .where(and(
        eq(heures.enseignantId, Number(enseignantId)),
        eq(heures.anneeId, Number(anneeId))
      ));

    // Get obligation
    const [obl] = await db.select().from(obligations)
      .where(and(
        eq(obligations.enseignantId, Number(enseignantId)),
        eq(obligations.anneeId, Number(anneeId))
      ));

    // Get paiements (avances)
    const paies = await db.select().from(paiements)
      .where(and(
        eq(paiements.enseignantId, Number(enseignantId)),
        eq(paiements.anneeId, Number(anneeId))
      ));

    // Calculate totals
    let totalET = 0, totalED = 0, totalEP = 0, totalSout = 0, totalRech = 0;
    const detailsParFaculte: Record<string, {
      etablissement: string;
      mention: string;
      parcours: string;
      et: number; ed: number; ep: number; sout: number; rech: number;
    }[]> = {};

    for (const h of heuresData) {
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

      const etab = h.faculte?.etablissement || "Non spécifié";
      if (!detailsParFaculte[etab]) detailsParFaculte[etab] = [];
      detailsParFaculte[etab].push({
        etablissement: etab,
        mention: h.faculte?.mention || "",
        parcours: h.faculte?.parcours || "",
        et, ed, ep, sout, rech,
      });
    }

    const hcBrut = calcHC(totalET, totalED, totalEP, totalSout, totalRech);
    
    // Obligation calculation
    const obligationBase = ens.grade?.obligationService || 0;
    const obligationCustom = obl?.heuresObligation ?? obligationBase;
    const isExempt = obl?.exempte ?? false;
    const obligationApplied = isExempt ? 0 : (ens.enseignant.statut === "Permanent" ? obligationCustom : 0);
    
    const { hcNette } = calcHCNette(hcBrut, obligationApplied, ens.enseignant.statut);
    const hcArrondi = Math.floor(hcNette);
    const taux = ens.grade?.tauxHoraire || 0;
    const montantBrut = calcMontantBrut(hcArrondi, taux);

    // Check plafond
    let montantBrutFinal = montantBrut;
    if (annee.plafondPaiement && montantBrut > Number(annee.plafondPaiement)) {
      montantBrutFinal = Number(annee.plafondPaiement);
    }

    // IRSA
    const appliquerIRSA = annee.appliquerIRSA ?? true;
    const tauxIRSA = annee.tauxIRSA ?? 20;
    const montantIRSA = calcIRSA(montantBrutFinal, tauxIRSA, appliquerIRSA);
    const montantNet = montantBrutFinal - montantIRSA;

    // Avances
    const totalAvance = paies.reduce((s, p) => s + (p.montantAvance || 0), 0);
    const netAPayer = montantNet - totalAvance;

    return NextResponse.json({
      numeroEtat,
      annee: annee.libelle,
      tranche: annee.tranche,
      enseignant: {
        nomPrenom: ens.enseignant.nomPrenom,
        cin: ens.enseignant.cin,
        dateNaissance: ens.enseignant.dateNaissance,
        telephone: ens.enseignant.telephone,
        email: ens.enseignant.email,
        rib: ens.enseignant.rib,
        banque: ens.enseignant.banque,
        statut: ens.enseignant.statut,
        specialite: ens.enseignant.specialite,
        etablissementPrincipal: ens.enseignant.etablissementPrincipal,
      },
      grade: ens.grade ? {
        code: ens.grade.code,
        libelle: ens.grade.libelle,
        taux: ens.grade.tauxHoraire,
      } : null,
      detailsParFaculte,
      totaux: {
        et: totalET,
        ed: totalED,
        ep: totalEP,
        soutenance: totalSout,
        recherche: totalRech,
        hcBrut,
        obligation: obligationApplied,
        exempte: isExempt,
        hcNette,
        hcArrondi,
      },
      calculs: {
        taux,
        montantBrut: montantBrutFinal,
        plafondApplique: annee.plafondPaiement ? Number(annee.plafondPaiement) : null,
        appliquerIRSA,
        tauxIRSA,
        montantIRSA,
        montantNet,
        totalAvance,
        netAPayer,
        netEnLettres: nombreEnLettres(netAPayer) + " ARIARY",
      },
      paiements: paies,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
