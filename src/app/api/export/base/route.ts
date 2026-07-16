import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { calcHC, calcHCNette, TAUX_GRADE } from "@/lib/metier";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anneeId = Number(searchParams.get("anneeId"));
  if (!anneeId) {
    return NextResponse.json({ error: "anneeId requis" }, { status: 400 });
  }

  const anneeRes = await db.execute(sql`
    SELECT * FROM annees_universitaires WHERE id = ${anneeId} LIMIT 1
  `);
  const annee = anneeRes.rows[0] as Record<string, unknown>;

  const rows = await db.execute(sql`
    SELECT
      e.id, e.nom_prenom, e.cin, e.statut, e.rib, e.specialite,
      e.etablissement_principal, e.telephone, e.email,
      g.code AS grade_code, g.taux_horaire, g.obligation_service,
      fp.etablissement AS fac_etab, fp.mention,
      COALESCE(SUM(h.et),0)         AS total_et,
      COALESCE(SUM(h.ed),0)         AS total_ed,
      COALESCE(SUM(h.ep),0)         AS total_ep,
      COALESCE(SUM(h.soutenance),0) AS total_soutenance,
      COALESCE(SUM(h.recherche),0)  AS total_recherche,
      COALESCE(SUM(h.avance),0)     AS total_avance,
      h.niveau
    FROM enseignants e
    LEFT JOIN grades_taux g ON e.grade_id = g.id
    LEFT JOIN heures_enseignement h ON h.enseignant_id = e.id AND h.annee_id = ${anneeId}
    LEFT JOIN facultes_parcours fp ON h.faculte_parcours_id = fp.id
    GROUP BY e.id, g.id, fp.id, h.niveau
    ORDER BY e.statut, e.nom_prenom
  `);

  // Enrichir avec les calculs
  const data = (rows.rows as Record<string, unknown>[]).map((r, idx) => {
    const grade   = (r.grade_code as string)  || "A";
    const statut  = (r.statut as string)      || "Vacataire";
    const taux    = TAUX_GRADE[grade]         ?? 0;
    const hc      = calcHC(
      Number(r.total_et), Number(r.total_ed), Number(r.total_ep),
      Number(r.total_soutenance), Number(r.total_recherche)
    );
    const { hcNette, obligation } = calcHCNette(hc, grade, statut);
    const hcArr   = Math.floor(hcNette);
    const montant = hcArr * taux;
    const avance  = Number(r.total_avance) || 0;

    return {
      numero: idx + 1,
      nomPrenom: r.nom_prenom,
      cin: r.cin,
      statut,
      grade,
      specialite: r.specialite,
      etablissement: r.etablissement_principal || r.fac_etab,
      mention: r.mention,
      niveau: r.niveau,
      et: Number(r.total_et),
      ed: Number(r.total_ed),
      ep: Number(r.total_ep),
      soutenance: Number(r.total_soutenance),
      recherche: Number(r.total_recherche),
      hcBrut: hc,
      obligation,
      hcConverties: hcArr,
      taux,
      montant,
      avance,
      netPayer: montant - avance,
      telephone: r.telephone,
      email: r.email,
      rib: r.rib,
    };
  });

  return NextResponse.json({
    annee: annee?.libelle || "",
    data,
  });
}
