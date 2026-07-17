import fs from "fs";
import path from "path";

// ═══════════════════════════════════════════════════════════════════════════════
// JSON-ONLY PERSISTENCE (remplace PostgreSQL + Drizzle)
// Fichiers dans /data/*.json
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filename: string, defaultValue: T[] = []): T[] {
  ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) || defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeJson<T>(filename: string, data: T[]) {
  ensureDir();
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Auto-increment helper
function nextId(items: { id?: number }[]): number {
  if (!items.length) return 1;
  return Math.max(0, ...items.map((i) => i.id || 0)) + 1;
}

// ───────────────────────────────────────────────────────────────────────────────
// TYPES (simples, compatibles avec anciens types)
// ───────────────────────────────────────────────────────────────────────────────

export interface Annee {
  id: number;
  libelle: string;
  tranche: string;
  active: boolean;
  appliquerIRSA: boolean;
  tauxIRSA: number;
  plafondPaiement: string | null;
  createdAt?: string;
}

export interface Grade {
  id: number;
  code: string;
  libelle: string;
  tauxHoraire: number;
}

export interface Faculte {
  id: number;
  etablissement: string;
  domaine: string;
  mention: string;
  parcours: string | null;
  niveau: string | null;
  code: string | null;
}

export interface Enseignant {
  id: number;
  nom: string;
  prenom: string | null;
  cin: string | null;
  dateCIN: string | null;
  dateNaissance: string | null;
  lieuNaissance: string | null;
  nationalite: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  rib: string | null;
  specialite: string | null;
  etablissementPrincipal: string | null;
  dateRecrutement: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Heure {
  id: number;
  enseignantId: number;
  anneeId: number;
  faculteId: number | null;
  gradeId: number | null;
  statut: string;
  heuresET: number;
  heuresED: number;
  heuresEP: number;
  heuresSoutenance: number;
  heuresRecherche: number;
  obligation: number;
  createdAt?: string;
}

export interface Paiement {
  id: number;
  enseignantId: number;
  anneeId: number;
  montantAvance: number;
  dateAvance: string | null;
  pourcentageTranche: number;
  montantPaye: number;
  datePaiement: string | null;
  reference: string | null;
  statut: string;
  createdAt?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// TABLES (lecture/écriture JSON)
// ───────────────────────────────────────────────────────────────────────────────

export function getAnnees(): Annee[] {
  return readJson<Annee>("annees.json");
}
export function saveAnnees(data: Annee[]) {
  writeJson("annees.json", data);
}

export function getGrades(): Grade[] {
  return readJson<Grade>("grades.json");
}
export function saveGrades(data: Grade[]) {
  writeJson("grades.json", data);
}

export function getFacultes(): Faculte[] {
  return readJson<Faculte>("facultes.json");
}
export function saveFacultes(data: Faculte[]) {
  writeJson("facultes.json", data);
}

export function getEnseignants(): Enseignant[] {
  return readJson<Enseignant>("enseignants.json");
}
export function saveEnseignants(data: Enseignant[]) {
  writeJson("enseignants.json", data);
}

export function getHeures(): Heure[] {
  return readJson<Heure>("heures.json");
}
export function saveHeures(data: Heure[]) {
  writeJson("heures.json", data);
}

export function getPaiements(): Paiement[] {
  return readJson<Paiement>("paiements.json");
}
export function savePaiements(data: Paiement[]) {
  writeJson("paiements.json", data);
}

// ───────────────────────────────────────────────────────────────────────────────
// CRUD HELPERS
// ───────────────────────────────────────────────────────────────────────────────

export function createAnnee(data: Omit<Annee, "id">): Annee {
  const list = getAnnees();
  const newItem: Annee = {
    id: nextId(list),
    ...data,
    createdAt: new Date().toISOString(),
  };
  list.push(newItem);
  saveAnnees(list);
  return newItem;
}

export function updateAnnee(id: number, data: Partial<Annee>): Annee | null {
  const list = getAnnees();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  saveAnnees(list);
  return list[idx];
}

export function deleteAnnee(id: number) {
  const list = getAnnees().filter((x) => x.id !== id);
  saveAnnees(list);
}

export function createGrade(data: Omit<Grade, "id">): Grade {
  const list = getGrades();
  const newItem: Grade = { id: nextId(list), ...data };
  list.push(newItem);
  saveGrades(list);
  return newItem;
}

export function updateGrade(id: number, data: Partial<Grade>): Grade | null {
  const list = getGrades();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  saveGrades(list);
  return list[idx];
}

export function createFaculte(data: Omit<Faculte, "id">): Faculte {
  const list = getFacultes();
  const newItem: Faculte = { id: nextId(list), ...data };
  list.push(newItem);
  saveFacultes(list);
  return newItem;
}

export function deleteFaculte(id: number) {
  const list = getFacultes().filter((x) => x.id !== id);
  saveFacultes(list);
}

export function createEnseignant(data: Omit<Enseignant, "id">): Enseignant {
  const list = getEnseignants();
  const now = new Date().toISOString();
  const newItem: Enseignant = {
    id: nextId(list),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  list.push(newItem);
  saveEnseignants(list);
  return newItem;
}

export function updateEnseignant(id: number, data: Partial<Enseignant>): Enseignant | null {
  const list = getEnseignants();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveEnseignants(list);
  return list[idx];
}

export function deleteEnseignant(id: number) {
  // Cascade delete heures + paiements
  const heures = getHeures().filter((h) => h.enseignantId !== id);
  saveHeures(heures);

  const paiements = getPaiements().filter((p) => p.enseignantId !== id);
  savePaiements(paiements);

  const list = getEnseignants().filter((x) => x.id !== id);
  saveEnseignants(list);
}

export function createHeure(data: Omit<Heure, "id">): Heure {
  const list = getHeures();
  const newItem: Heure = {
    id: nextId(list),
    ...data,
    createdAt: new Date().toISOString(),
  };
  list.push(newItem);
  saveHeures(list);
  return newItem;
}

export function updateHeure(id: number, data: Partial<Heure>): Heure | null {
  const list = getHeures();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  saveHeures(list);
  return list[idx];
}

export function deleteHeure(id: number) {
  const list = getHeures().filter((x) => x.id !== id);
  saveHeures(list);
}

export function createPaiement(data: Omit<Paiement, "id">): Paiement {
  const list = getPaiements();
  const newItem: Paiement = {
    id: nextId(list),
    ...data,
    createdAt: new Date().toISOString(),
  };
  list.push(newItem);
  savePaiements(list);
  return newItem;
}

export function deletePaiement(id: number) {
  const list = getPaiements().filter((x) => x.id !== id);
  savePaiements(list);
}

// ───────────────────────────────────────────────────────────────────────────────
// SEED (initialisation si fichiers vides)
// ───────────────────────────────────────────────────────────────────────────────

export function seedIfEmpty() {
  // Grades
  let grades = getGrades();
  if (grades.length === 0) {
    grades = [
      { id: 1, code: "A", libelle: "Assistant", tauxHoraire: 6000 },
      { id: 2, code: "MC", libelle: "Maître de Conférences", tauxHoraire: 8000 },
      { id: 3, code: "PR", libelle: "Professeur", tauxHoraire: 10000 },
      { id: 4, code: "PRT", libelle: "Professeur Titulaire", tauxHoraire: 12000 },
    ];
    saveGrades(grades);
  }

  // Annees
  let annees = getAnnees();
  if (annees.length === 0) {
    annees = [
      { id: 1, libelle: "2023-2024", tranche: "Première tranche", active: false, appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: null },
      { id: 2, libelle: "2024-2025", tranche: "Première tranche", active: true, appliquerIRSA: true, tauxIRSA: 20, plafondPaiement: null },
      { id: 3, libelle: "2025-2026", tranche: "Première tranche", active: false, appliquerIRSA: false, tauxIRSA: 20, plafondPaiement: null },
    ];
    saveAnnees(annees);
  }

  // Facultes
  let facultes = getFacultes();
  if (facultes.length === 0) {
    facultes = [
      { id: 1, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Génie Logiciel", niveau: "L3", code: "UT-ST-INFO-GL" },
      { id: 2, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Réseaux et Systèmes", niveau: "L3", code: "UT-ST-INFO-RS" },
      { id: 3, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Mathématiques", parcours: "Mathématiques Appliquées", niveau: "M1", code: "UT-ST-MATH-MA" },
      { id: 4, etablissement: "Université de Toliara", domaine: "Lettres et Sciences Humaines", mention: "Lettres Modernes", parcours: "Littérature Malgache", niveau: "L2", code: "UT-LSH-LM-LIT" },
      { id: 5, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Génie Civil", parcours: "Bâtiment et Travaux Publics", niveau: "M2", code: "UT-ST-GC-BTP" },
      { id: 6, etablissement: "ENS Toliara", domaine: "Sciences de l'Éducation", mention: "Sciences Physiques", parcours: "Physique-Chimie", niveau: "L3", code: "ENS-SE-SP-PC" },
      { id: 7, etablissement: "IHSM", domaine: "Sciences de la Mer", mention: "Oceanographie", parcours: "Halieutique", niveau: "M1", code: "IHSM-SM-OCEAN-HAL" },
      { id: 8, etablissement: "Université de Toliara", domaine: "Droit, Economie, Gestion", mention: "Droit Public", parcours: "Droit Public Interne", niveau: "M1", code: "UT-DEG-DPUB" },
    ];
    saveFacultes(facultes);
  }

  // Enseignants, heures, paiements restent vides au départ
  // (ils sont créés par l'utilisateur)
}

// Appel automatique au chargement du module
seedIfEmpty();
