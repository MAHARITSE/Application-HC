// ═══════════════════════════════════════════════════════════════════════════════
// RÈGLES MÉTIER – Heures Complémentaires (conforme prompt.md)
// ═══════════════════════════════════════════════════════════════════════════════

export const TAUX_GRADE: Record<string, number> = {
  A: 6000,
  MC: 8000,
  PR: 10000,
  PRT: 12000,
};

export const GRADE_LIBELLES: Record<string, string> = {
  A: "Assistant",
  MC: "Maître de Conférences",
  PR: "Professeur",
  PRT: "Professeur Titulaire",
};

// Alias pour compatibilité ancienne codebase
export const TAUX_PAR_GRADE = TAUX_GRADE;
export const ETABLISSEMENTS_TOLIARA = [
  "Faculté des Sciences",
  "Faculté des Lettres",
  "École Polytechnique",
  "ENS",
  "IHSM",
  "Faculté de Médecine",
  "Faculté de Droit",
];

/**
 * Calcul des Heures Complémentaires selon prompt.md
 * HC Brut = ET + ED + EP + Soutenance + Recherche
 */
export function calcHC(
  et: number,
  ed: number,
  ep: number,
  soutenance: number,
  recherche: number
): number {
  return (et || 0) + (ed || 0) + (ep || 0) + (soutenance || 0) + (recherche || 0);
}

// Compat
export const calculerHC = calcHC;

/**
 * Obligation selon prompt:
 * - valeur saisie (défaut 125h, 0 pour vacataires)
 * Si statut = "Permanent" ET obligation > 0: HC Nette = max(0, HC Brut - Obligation)
 * Sinon: HC Nette = HC Brut
 */
export function calcHCNette(
  hcBrut: number,
  obligation: number,
  statut: string
): { hcNette: number; obligationAppliquee: number } {
  const obl = Number(obligation) || 0;
  if (statut === "Permanent" && obl > 0) {
    return { hcNette: Math.max(hcBrut - obl, 0), obligationAppliquee: obl };
  }
  return { hcNette: hcBrut, obligationAppliquee: statut === "Permanent" ? obl : 0 };
}

/**
 * HC Arrondie = floor(HC Nette)
 */
export function calcHCArrondie(hcNette: number): number {
  return Math.floor(hcNette || 0);
}

/**
 * Montant Brut = HC Arrondie × Taux Horaire
 * Si plafond défini ET Montant Brut > plafond: Montant Brut = plafond
 */
export function calcMontantBrut(
  hcArrondi: number,
  tauxHoraire: number,
  plafond?: number | null
): number {
  let montant = Math.floor(hcArrondi || 0) * (tauxHoraire || 0);
  if (plafond != null && plafond > 0 && montant > plafond) {
    montant = plafond;
  }
  return montant;
}

/**
 * IRSA = Montant Brut × (tauxIRSA / 100) si appliquerIRSA
 */
export function calcIRSA(
  montantBrut: number,
  tauxIRSA: number,
  appliquerIRSA: boolean
): number {
  if (!appliquerIRSA) return 0;
  return Math.round((montantBrut || 0) * ((tauxIRSA || 0) / 100));
}

/**
 * Montant Net = Montant Brut - IRSA
 * Net à Payer = Montant Net - Total Avances
 */
export function calcMontantNet(montantBrut: number, irsa: number): number {
  return (montantBrut || 0) - (irsa || 0);
}

export function calcNetAPayer(montantNet: number, totalAvances: number): number {
  return (montantNet || 0) - (totalAvances || 0);
}

/**
 * Fonction complète conforme au prompt.md pour un enseignant
 */
export function calculComplet(params: {
  et: number;
  ed: number;
  ep: number;
  soutenance: number;
  recherche: number;
  obligation: number;
  statut: string; // Permanent | Vacataire
  tauxHoraire: number;
  plafond?: number | null;
  appliquerIRSA: boolean;
  tauxIRSA: number;
  totalAvances: number;
}) {
  const hcBrut = calcHC(
    params.et,
    params.ed,
    params.ep,
    params.soutenance,
    params.recherche
  );
  const { hcNette, obligationAppliquee } = calcHCNette(
    hcBrut,
    params.obligation,
    params.statut
  );
  const hcArrondie = calcHCArrondie(hcNette);
  const montantBrut = calcMontantBrut(
    hcArrondie,
    params.tauxHoraire,
    params.plafond
  );
  const irsa = calcIRSA(montantBrut, params.tauxIRSA, params.appliquerIRSA);
  const montantNet = calcMontantNet(montantBrut, irsa);
  const netAPayer = calcNetAPayer(montantNet, params.totalAvances);

  return {
    hcBrut,
    obligationAppliquee,
    hcNette,
    hcArrondie,
    tauxHoraire: params.tauxHoraire,
    montantBrut,
    irsa,
    montantNet,
    netAPayer,
  };
}

// ── Formatages ───────────────────────────────────────────────────────────────

export function formatAriary(v: number): string {
  return new Intl.NumberFormat("fr-MG").format(Math.round(v || 0)) + " Ar";
}

// ── Conversion nombre en lettres (FR, majuscules pour fiches officielles) ──

const UNITS = [
  "",
  "UN",
  "DEUX",
  "TROIS",
  "QUATRE",
  "CINQ",
  "SIX",
  "SEPT",
  "HUIT",
  "NEUF",
  "DIX",
  "ONZE",
  "DOUZE",
  "TREIZE",
  "QUATORZE",
  "QUINZE",
  "SEIZE",
  "DIX-SEPT",
  "DIX-HUIT",
  "DIX-NEUF",
];
const TENS = [
  "",
  "DIX",
  "VINGT",
  "TRENTE",
  "QUARANTE",
  "CINQUANTE",
  "SOIXANTE",
  "SOIXANTE",
  "QUATRE-VINGT",
  "QUATRE-VINGT",
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
    const base = TENS[d] + (u ? "-" + UNITS[u] : "");
    if (d === 8 && u === 0) return base + "S";
    return base;
  }
  const c = Math.floor(n / 100);
  const r = n % 100;
  // CENT
  const cent = (c === 1 ? "" : UNITS[c] + " ") + "CENT";
  if (r === 0) return c > 1 ? cent + "S" : cent;
  return cent + " " + sousMilleFR(r);
}

export function nombreEnLettres(n: number): string {
  if (n === 0) return "ZÉRO";
  const nInt = Math.floor(Math.abs(n));
  if (n < 0) return "MOINS " + nombreEnLettres(-n);

  if (nInt === 0) return "ZÉRO";

  const milliards = Math.floor(nInt / 1_000_000_000);
  const millions = Math.floor((nInt % 1_000_000_000) / 1_000_000);
  const milliers = Math.floor((nInt % 1_000_000) / 1_000);
  const reste = nInt % 1_000;

  const parts: string[] = [];
  if (milliards) {
    if (milliards === 1) parts.push("UN MILLIARD");
    else parts.push(sousMilleFR(milliards) + " MILLIARDS");
  }
  if (millions) {
    if (millions === 1) parts.push("UN MILLION");
    else parts.push(sousMilleFR(millions) + " MILLIONS");
  }
  if (milliers) {
    if (milliers === 1) parts.push("MILLE");
    else parts.push(sousMilleFR(milliers) + " MILLE");
  }
  if (reste) parts.push(sousMilleFR(reste));

  return parts.join(" ").trim() || "ZÉRO";
}

export function montantEnLettres(montant: number): string {
  return nombreEnLettres(Math.round(montant)) + " ARIARY";
}
