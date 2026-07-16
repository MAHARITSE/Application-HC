// ═══════════════════════════════════════════════════════════════════════════════
// RÈGLES MÉTIER – Heures Complémentaires
// ═══════════════════════════════════════════════════════════════════════════════

export const TAUX_GRADE: Record<string, number> = {
  A:   6_000,
  MC:  8_000,
  PR:  10_000,
  PRT: 12_000,
};

export const OBLIGATION_SERVICE: Record<string, number> = {
  A:   192,
  MC:  128,
  PR:  96,
  PRT: 96,
};

export const GRADE_LIBELLES: Record<string, string> = {
  A:   "Assistant",
  MC:  "Maître de Conférences",
  PR:  "Professeur",
  PRT: "Professeur Titulaire",
};

/** Calcule le total des HC brutes */
export function calcHC(
  et: number,
  ed: number,
  ep: number,
  soutenance: number,
  recherche: number
): number {
  return (et || 0) + (ed || 0) + (ep || 0) + (soutenance || 0) + (recherche || 0);
}

/** Retourne { hcNette, obligation } */
export function calcHCNette(
  hc: number,
  obligation: number,
  statut: string
): { hcNette: number; obligationAppliquee: number } {
  if (statut === "Permanent") {
    return { hcNette: Math.max(hc - obligation, 0), obligationAppliquee: obligation };
  }
  return { hcNette: hc, obligationAppliquee: 0 };
}

/** Calcule le montant brut */
export function calcMontantBrut(hcArrondi: number, taux: number): number {
  return Math.floor(hcArrondi) * taux;
}

/** Calcule l'IRSA */
export function calcIRSA(montantBrut: number, tauxIRSA: number, appliquer: boolean): number {
  if (!appliquer) return 0;
  return Math.round(montantBrut * (tauxIRSA / 100));
}

/** Formate en Ariary */
export function formatAriary(v: number): string {
  return new Intl.NumberFormat("fr-MG").format(v) + " Ar";
}

// ── Conversion nombre en lettres (français) ──────────────────────────────────
const UNITS = [
  "", "UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT",
  "HUIT", "NEUF", "DIX", "ONZE", "DOUZE", "TREIZE", "QUATORZE",
  "QUINZE", "SEIZE", "DIX-SEPT", "DIX-HUIT", "DIX-NEUF",
];
const TENS = [
  "", "DIX", "VINGT", "TRENTE", "QUARANTE", "CINQUANTE",
  "SOIXANTE", "SOIXANTE", "QUATRE-VINGT", "QUATRE-VINGT",
];

function sousMilleFR(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNITS[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (d === 7 || d === 9) {
      return TENS[d] + (u ? "-" + UNITS[10 + u] : "-DIX");
    }
    return TENS[d] + (u ? "-" + UNITS[u] : "");
  }
  const c = Math.floor(n / 100);
  const r = n % 100;
  const cent = (c === 1 ? "" : UNITS[c] + " ") + "CENT";
  if (r) return cent + " " + sousMilleFR(r);
  return c > 1 ? cent + "S" : cent;
}

export function nombreEnLettres(n: number): string {
  if (n === 0) return "ZÉRO";
  const nInt = Math.round(n);
  if (nInt < 0) return "MOINS " + nombreEnLettres(-nInt);

  const milliards = Math.floor(nInt / 1_000_000_000);
  const millions  = Math.floor((nInt % 1_000_000_000) / 1_000_000);
  const milliers  = Math.floor((nInt % 1_000_000) / 1_000);
  const reste     = nInt % 1_000;

  const parts: string[] = [];
  if (milliards) parts.push(sousMilleFR(milliards) + " MILLIARD" + (milliards > 1 ? "S" : ""));
  if (millions)  parts.push(sousMilleFR(millions)  + " MILLION"  + (millions  > 1 ? "S" : ""));
  if (milliers)  parts.push(milliers === 1 ? "MILLE" : sousMilleFR(milliers) + " MILLE");
  if (reste)     parts.push(sousMilleFR(reste));

  return parts.join(" ").trim();
}

export function montantEnLettres(montant: number): string {
  return nombreEnLettres(montant) + " ARIARY";
}
