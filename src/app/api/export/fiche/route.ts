import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  calcHC, calcHCNette, calcMontantBrut,
  nombreEnLettres, TAUX_GRADE, ETABLISSEMENTS_TOLIARA,
} from "@/lib/metier";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const enseignantId = Number(searchParams.get("enseignantId"));
  const anneeId      = Number(searchParams.get("anneeId"));
  const numeroEtat   = searchParams.get("numeroEtat") || "0001";

  if (!enseignantId || !anneeId) {
    return NextResponse.json({ error: "enseignantId et anneeId requis" }, { status: 400 });
  }

  // Charger données
  const ensRes = await db.execute(sql`
    SELECT e.*, g.code AS grade_code, g.taux_horaire, g.obligation_service
    FROM enseignants e LEFT JOIN grades_taux g ON e.grade_id = g.id
    WHERE e.id = ${enseignantId} LIMIT 1
  `);
  const ens = ensRes.rows[0] as Record<string, unknown>;

  const anneeRes = await db.execute(sql`
    SELECT * FROM annees_universitaires WHERE id = ${anneeId} LIMIT 1
  `);
  const annee = anneeRes.rows[0] as Record<string, unknown>;

  const heuresRes = await db.execute(sql`
    SELECT h.* FROM heures_enseignement h
    WHERE h.enseignant_id = ${enseignantId} AND h.annee_id = ${anneeId}
  `);
  const heures = heuresRes.rows as Record<string, unknown>[];

  if (!ens) return NextResponse.json({ error: "Enseignant non trouvé" }, { status: 404 });

  const grade   = (ens.grade_code as string) || "A";
  const taux    = TAUX_GRADE[grade] ?? 0;
  const statut  = (ens.statut as string) || "Vacataire";
  const anneeLib = (annee?.libelle as string) || "----/----";
  const tranche  = (annee?.tranche as string) || "Première tranche";

  // Agréger par établissement
  const etabMap: Record<string, { ET: number; ED: number; EP: number; Sout: number; Rech: number }> = {};
  for (const etab of ETABLISSEMENTS_TOLIARA) {
    etabMap[etab] = { ET: 0, ED: 0, EP: 0, Sout: 0, Rech: 0 };
  }
  for (const h of heures) {
    const etab = ((h.etablissement as string) || "").trim();
    if (!etabMap[etab]) etabMap[etab] = { ET: 0, ED: 0, EP: 0, Sout: 0, Rech: 0 };
    etabMap[etab].ET   += Number(h.et)         || 0;
    etabMap[etab].ED   += Number(h.ed)         || 0;
    etabMap[etab].EP   += Number(h.ep)         || 0;
    etabMap[etab].Sout += Number(h.soutenance) || 0;
    etabMap[etab].Rech += Number(h.recherche)  || 0;
  }

  const totalET   = Object.values(etabMap).reduce((s, v) => s + v.ET,   0);
  const totalED   = Object.values(etabMap).reduce((s, v) => s + v.ED,   0);
  const totalEP   = Object.values(etabMap).reduce((s, v) => s + v.EP,   0);
  const totalSout = Object.values(etabMap).reduce((s, v) => s + v.Sout, 0);
  const totalRech = Object.values(etabMap).reduce((s, v) => s + v.Rech, 0);
  const totalHC   = calcHC(totalET, totalED, totalEP, totalSout, totalRech);
  const { hcNette, obligation } = calcHCNette(totalHC, grade, statut);
  const hcArrondi  = Math.floor(hcNette);
  const montantBrut = calcMontantBrut(hcArrondi, grade);
  const avanceTotal = heures.reduce((s, h) => s + (Number(h.avance) || 0), 0);
  const netPayer    = montantBrut - avanceTotal;
  const lettres     = nombreEnLettres(netPayer) + " ARIARY";

  // Retourner JSON structuré pour l'affichage et l'export
  return NextResponse.json({
    enseignant: {
      nomPrenom: ens.nom_prenom,
      grade: grade,
      gradeLibelle: ens.grade_libelle,
      rib: ens.rib,
      cin: ens.cin,
      statut,
    },
    annee: { libelle: anneeLib, tranche },
    numeroEtat,
    calculs: {
      etabData: etabMap,
      totaux: { et: totalET, ed: totalED, ep: totalEP, soutenance: totalSout, recherche: totalRech },
      totalHC,
      obligation,
      hcNette,
      hcArrondi,
      taux,
      montantBrut,
      avanceTotal,
      netPayer,
      lettres,
    },
  });
}
