// Taux horaire selon le grade (en Ariary)
export const TAUX_PAR_GRADE: Record<string, number> = {
  A: 6000,
  MC: 8000,
  PR: 10000,
  PRT: 12000,
};

// Heures d'obligation de service pour les permanents
export const OBLIGATION_SERVICE_PERMANENT = 125;

// Taux ISRA (Impôt Synthétique sur les Revenus Assimilés) = 20%
export const TAUX_ISRA = 0.2;

export const GRADES = ["A", "MC", "PR", "PRT"] as const;
export const STATUTS = ["Permanent", "Vacataire"] as const;

export type Grade = (typeof GRADES)[number];
export type Statut = (typeof STATUTS)[number];

// Calcul des heures complémentaires
export function calculerHC(
  et: number,
  ed: number,
  ep: number,
  soutenance: number,
  recherche: number
): number {
  return et + ed + ep + soutenance + recherche;
}

// Heures à payer après soustraction de l'obligation de service
export function calculerHeuresAPayer(
  hcBrut: number,
  statut: string
): number {
  if (statut === "Permanent") {
    return Math.max(0, hcBrut - OBLIGATION_SERVICE_PERMANENT);
  }
  return hcBrut;
}

// Montant brut
export function calculerMontantBrut(heuresAPayer: number, grade: string): number {
  const taux = TAUX_PAR_GRADE[grade] || 0;
  return heuresAPayer * taux;
}

// ISRA applicable uniquement aux vacataires
export function calculerISRA(montantBrut: number, statut: string): number {
  if (statut === "Vacataire") {
    return montantBrut * TAUX_ISRA;
  }
  return 0;
}

// Net à payer
export function calculerNetAPayer(
  montantBrut: number,
  isra: number,
  avance: number
): number {
  return montantBrut - isra - avance;
}

// Convertir un nombre en lettres (français)
export function nombreEnLettres(n: number): string {
  if (n === 0) return "zéro";
  if (n < 0) return "moins " + nombreEnLettres(-n);

  const units = [
    "", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf",
  ];
  const tens = [
    "", "", "vingt", "trente", "quarante", "cinquante",
    "soixante", "soixante", "quatre-vingt", "quatre-vingt",
  ];

  function convertBelow1000(num: number): string {
    if (num === 0) return "";
    if (num < 20) return units[num];
    if (num < 100) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7 || t === 9) {
        // 70s and 90s
        const base = tens[t];
        const rest = (t === 7 ? 10 : 10) + u;
        if (rest === 10) return base + "-dix";
        return base + "-" + units[rest];
      }
      if (u === 0) {
        if (t === 8) return "quatre-vingts";
        return tens[t];
      }
      if (u === 1 && t !== 8) return tens[t] + " et un";
      return tens[t] + "-" + units[u];
    }
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let result = "";
    if (h === 1) {
      result = "cent";
    } else {
      result = units[h] + " cent";
    }
    if (rest === 0 && h > 1) return result + "s";
    if (rest > 0) result += " " + convertBelow1000(rest);
    return result;
  }

  let result = "";
  const billions = Math.floor(n / 1000000000);
  const millions = Math.floor((n % 1000000000) / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = Math.floor(n % 1000);

  if (billions > 0) {
    result += convertBelow1000(billions) + " milliard";
    if (billions > 1) result += "s";
    result += " ";
  }
  if (millions > 0) {
    result += convertBelow1000(millions) + " million";
    if (millions > 1) result += "s";
    result += " ";
  }
  if (thousands > 0) {
    if (thousands === 1) {
      result += "mille ";
    } else {
      result += convertBelow1000(thousands) + " mille ";
    }
  }
  if (remainder > 0) {
    result += convertBelow1000(remainder);
  }

  result = result.trim();

  // Handle decimals
  const decimals = Math.round((n - Math.floor(n)) * 100);
  if (decimals > 0) {
    result += " virgule " + convertBelow1000(decimals);
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Format number as Ariary
export function formatAriary(amount: number): string {
  return new Intl.NumberFormat("fr-MG").format(amount) + " Ar";
}
