// Legacy wrapper - conserve compatibilité mais expose calculs conformes prompt.md
export {
  TAUX_GRADE,
  TAUX_PAR_GRADE,
  GRADE_LIBELLES,
  calcHC,
  calcHCNette,
  calcMontantBrut,
  calcIRSA,
  calcMontantNet,
  calcNetAPayer,
  calculComplet,
  formatAriary,
  nombreEnLettres,
  montantEnLettres,
} from "./metier";

import {
  calcHC,
  calcHCNette,
  calcMontantBrut,
  calcIRSA,
  calcMontantNet,
  calcNetAPayer as calcNet,
  formatAriary,
} from "./metier";

export const OBLIGATION_SERVICE_PERMANENT = 125;
export const TAUX_ISRA = 0.2;
export const GRADES = ["A", "MC", "PR", "PRT"] as const;
export const STATUTS = ["Permanent", "Vacataire"] as const;
export type Grade = (typeof GRADES)[number];
export type Statut = (typeof STATUTS)[number];

export function calculerHC(et: number, ed: number, ep: number, soutenance: number, recherche: number): number {
  return calcHC(et, ed, ep, soutenance, recherche);
}

export function calculerHeuresAPayer(hcBrut: number, statut: string): number {
  const obl = statut === "Permanent" ? OBLIGATION_SERVICE_PERMANENT : 0;
  const { hcNette } = calcHCNette(hcBrut, obl, statut);
  return Math.floor(hcNette);
}

export function calculerMontantBrut(heuresAPayer: number, grade: string): number {
  const tauxMap: Record<string, number> = { A: 6000, MC: 8000, PR: 10000, PRT: 12000 };
  const taux = tauxMap[grade] || 0;
  return calcMontantBrut(heuresAPayer, taux);
}

export function calculerISRA(montantBrut: number, statut: string): number {
  if (statut === "Vacataire") return Math.round(montantBrut * 0.2);
  return 0;
}

export function calculerNetAPayer(montantBrut: number, isra: number, avance: number): number {
  const net = calcMontantNet(montantBrut, isra);
  return calcNet(net, avance);
}
