// ═══════════════════════════════════════════════════════════════
// Formatages selon prompt.md : MAJUSCULES, Title Case, masques
// ═══════════════════════════════════════════════════════════════

/** Nom toujours en MAJUSCULES */
export function toUpperCase(value: string): string {
  return value ? value.trim().toUpperCase() : "";
}

/** Title Case : première lettre de chaque mot en majuscule */
export function toTitleCase(value: string): string {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      // Gère les apostrophes et tirets: "andravohangy" -> "Andravohangy", "jean-pierre" -> "Jean-Pierre"
      return word
        .split(/([-'])/)
        .map((part) => {
          if (part === "-" || part === "'") return part;
          if (!part) return "";
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join("");
    })
    .join(" ");
}

/** Masque téléphone: 000 00 000 00 (10 chiffres) */
export function formatTelephoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  // Format progressif: 034 12 345 67
  let formatted = "";
  if (digits.length <= 3) formatted = digits;
  else if (digits.length <= 5) formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
  else if (digits.length <= 8) formatted = `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  else formatted = `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  return formatted;
}

export function parseTelephone(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export function isValidTelephone(formatted: string): boolean {
  const d = parseTelephone(formatted);
  return d.length === 10;
}

/** Masque RIB: 00005 00001 12094250100 09
 * Format bancaire malgache: 5 + 5 + 11 + 2 = 23 chiffres + espaces
 * On autorise 23 à 30 chiffres au cas où, mais on formate en blocs 5-5-11-2 + reste
 */
export function formatRIBInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 30);
  if (digits.length === 0) return "";
  // Essaye de respecter le pattern 5 5 11 2
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 10));
  if (digits.length > 10) parts.push(digits.slice(10, 21));
  if (digits.length > 21) parts.push(digits.slice(21, 23));
  if (digits.length > 23) parts.push(digits.slice(23));
  return parts.filter(Boolean).join(" ").trim();
}

export function parseRIB(formatted: string): string {
  return formatted.replace(/\s/g, "");
}

export function isValidEmail(email: string): boolean {
  if (!email) return true; // optionnel
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Normalisation faculté: Title Case pour libellés, upper pour code éventuel */
export function normalizeFaculteField(value: string): string {
  return toTitleCase(value);
}

/** Nettoie et valide les heures (doivent être >=0) */
export function parseHeure(value: unknown): number {
  const n = Number(value);
  if (isNaN(n) || n < 0) return 0;
  return n;
}
