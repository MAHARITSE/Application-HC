import fs from "fs";
import path from "path";

// ════════════════════════════════════════════════════════════════════════════════
// JSON-ONLY PERSISTENCE (remplace PostgreSQL + Drizzle)
// Fichiers dans /data/*.json
// ════════════════════════════════════════════════════════════════════════════════

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
  formuleHC?: string;
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

export function updateFaculte(id: number, data: Partial<Faculte>): Faculte | null {
  const list = getFacultes();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  saveFacultes(list);
  return list[idx];
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

  // Facultes (sans niveau)
  let facultes = getFacultes();
  if (facultes.length === 0) {
    facultes = [
      { id: 1, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Génie Logiciel", code: "UT-ST-INFO-GL" },
      { id: 2, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Informatique", parcours: "Réseaux et Systèmes", code: "UT-ST-INFO-RS" },
      { id: 3, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Mathématiques", parcours: "Mathématiques Appliquées", code: "UT-ST-MATH-MA" },
      { id: 4, etablissement: "Université de Toliara", domaine: "Lettres et Sciences Humaines", mention: "Lettres Modernes", parcours: "Littérature Malgache", code: "UT-LSH-LM-LIT" },
      { id: 5, etablissement: "Université de Toliara", domaine: "Sciences et Technologies", mention: "Génie Civil", parcours: "Bâtiment et Travaux Publics", code: "UT-ST-GC-BTP" },
      { id: 6, etablissement: "ENS Toliara", domaine: "Sciences de l'Éducation", mention: "Sciences Physiques", parcours: "Physique-Chimie", code: "ENS-SE-SP-PC" },
      { id: 7, etablissement: "IHSM", domaine: "Sciences de la Mer", mention: "Oceanographie", parcours: "Halieutique", code: "IHSM-SM-OCEAN-HAL" },
      { id: 8, etablissement: "Université de Toliara", domaine: "Droit, Economie, Gestion", mention: "Droit Public", parcours: "Droit Public Interne", code: "UT-DEG-DPUB" },
      // Nouvelles facultés basées sur les données enseignants fournies
      { id: 9, etablissement: "IES-Menabe", domaine: "Environnement", mention: "Technique de l'Environnement", parcours: null, code: "IES-MEN-ENV" },
      { id: 10, etablissement: "SCIENCES", domaine: "Sciences de la Vie", mention: "Sciences de la Vie", parcours: null, code: "SCI-SV" },
      { id: 11, etablissement: "Fac Lettres", domaine: "Lettres", mention: "Etude Francçaise et francophones", parcours: null, code: "FL-EFF" },
      { id: 12, etablissement: "IES-Toliara", domaine: "Agronomie", mention: "Agronomie", parcours: null, code: "IES-TOL-AGR" },
      { id: 13, etablissement: "Fac Lettres", domaine: "Géographie", mention: "Géographie", parcours: null, code: "FL-GEO" },
      { id: 14, etablissement: "SCIENCES", domaine: "Chimie", mention: "chimie", parcours: null, code: "SCI-CHIM" },
      { id: 15, etablissement: "SCIENCES", domaine: "Physique", mention: "Physique et Applications", parcours: null, code: "SCI-PHYS" },
      { id: 16, etablissement: "IES-ANOSY", domaine: "Environnement", mention: "Technique de l'environnement marin et terrestre", parcours: null, code: "IES-ANOSY-ENV" },
      { id: 17, etablissement: "DEGS", domaine: "Gestion", mention: "Gestion", parcours: null, code: "DEGS-GEST" },
      { id: 18, etablissement: "DEGS", domaine: "Droit", mention: "Droit", parcours: null, code: "DEGS-DROIT" },
      { id: 19, etablissement: "Fac Lettres", domaine: "Malagasy", mention: "Malagasy", parcours: null, code: "FL-MAL" },
      { id: 20, etablissement: "CURA", domaine: "Arts et Lettres", mention: "Arts, lettres et sciences humaines", parcours: null, code: "CURA-ALSH" },
      { id: 21, etablissement: "ENS", domaine: "Enseignement", mention: "Metiers de L'enseignement des Lettres", parcours: null, code: "ENS-MEL" },
      { id: 22, etablissement: "Fac Lettres", domaine: "Philosophie", mention: "Philosophie", parcours: null, code: "FL-PHILO" },
      { id: 23, etablissement: "SCIENCES", domaine: "Biodiversité", mention: "Biodiversité", parcours: null, code: "SCI-BIODIV" },
      { id: 24, etablissement: "MEDECINE", domaine: "Sciences de Santé", mention: "Sciences de Santé", parcours: null, code: "MED-SANTE" },
      { id: 25, etablissement: "CURA", domaine: "Sciences et Technologies", mention: "Sciences, Technologie et Environnement", parcours: null, code: "CURA-STE" },
      { id: 26, etablissement: "Fac Lettres", domaine: "Histoire", mention: "Histoire", parcours: null, code: "FL-HIST" },
      { id: 27, etablissement: "SCIENCES", domaine: "Sciences de la Terre", mention: "Sciences de la terre", parcours: null, code: "SCI-SOL" },
      { id: 28, etablissement: "IHSM", domaine: "Sciences Marines", mention: "Sciences Marine et Halieutiques", parcours: null, code: "IHSM-SMH" },
      { id: 29, etablissement: "SCIENCES", domaine: "Sciences de la Vie", mention: "Sciences de la Vie", parcours: null, code: "SCI-SV2" },
    ];
    saveFacultes(facultes);
  }

  // Enseignants - Ajout de la liste fournie
  let enseignants = getEnseignants();
  if (enseignants.length === 0) {
    const enseignantsData = [
      { nom: "ANDRIAFIDISON", prenom: "Daudet", cin: "409 011 000 737", contact: "", grade: "MC", mention: "Technique de l'Environnement", etablissement: "IES-Menabe", statut: "PERM" },
      { nom: "ANDRIAMALALA", prenom: "Daniela", cin: "101 212 115 676", contact: "034 72 711 63", grade: "MC", mention: "Sciences de la Vie", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "ANDRIAMAMPIANINA", prenom: "Hanitra Sylvia", cin: "520 052 001 555", contact: "0342933949", grade: "PRT", mention: "Etude Francçaise et francophones", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "ANDRIAMANALINA", prenom: "Solonirina Bruno", cin: "101 251 043 609", contact: "033 09 642 72", grade: "MC", mention: "Agronomie", etablissement: "IES-Toliara", statut: "PERM" },
      { nom: "ANDRIAMANARIVO", prenom: "Francklin", cin: "501 071 001 099", contact: "0341516009", grade: "A", mention: "Géographie", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "ANDRIANARIJAONA", prenom: "Mamy", cin: "508 991 013 602", contact: "341062553", grade: "MC", mention: "chimie", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "ANDRIANARIMANANA", prenom: "Rivesty Aimé", cin: "507 011 004 403", contact: "0347693238", grade: "A", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "ANDRIANARIVELO", prenom: "Norbert", cin: "501 031 002 208", contact: "0346042726", grade: "MC", mention: "Technique de l'environnement marin et terrestre", etablissement: "IES-ANOSY", statut: "PERM" },
      { nom: "ANDRIANIVONIAINA", prenom: "Agnes Raissa", cin: "501 072 020 609", contact: "034 84 403 20", grade: "A", mention: "Gestion", etablissement: "DEGS", statut: "PERM" },
      { nom: "ATAOVIHATEHITROATSY", prenom: "Clérmonne", cin: "501 092 007 546", contact: "034 72 841 20", grade: "A", mention: "Droit", etablissement: "DEGS", statut: "PERM" },
      { nom: "BEHARIVA DE MOUSSA", prenom: "Aurélien", cin: "501 991 039 232", contact: "347027590", grade: "MC", mention: "Malagasy", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "BEMANANJARA", prenom: "Mahabibo", cin: "504 994 030 642", contact: "033 13 913 73", grade: "A", mention: "Sciences de la Vie", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "BEMIARANA", prenom: "Jean Marie", cin: "501 112 014 172", contact: "340376398", grade: "MC", mention: "Etude Francçaise et francophones", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "BEMIASA", prenom: "Jaona", cin: "", contact: "", grade: "MC", mention: "Sciences Marine et Halieutiques", etablissement: "IHSM", statut: "PERM" },
      { nom: "BENOLO", prenom: "Francois", cin: "201 991 026 073", contact: "033 08 320 11", grade: "A", mention: "Arts, lettres et sciences humaines", etablissement: "CURA", statut: "PERM" },
      { nom: "BIALAHY", prenom: "William Zozol", cin: "501 071 003 800", contact: "0348057694", grade: "MC", mention: "Metiers de L'enseignement des Lettres", etablissement: "ENS", statut: "PERM" },
      { nom: "BIVIARISOLO", prenom: "Djacoba Aurore", cin: "401 992 026 649", contact: "0349209204", grade: "MC", mention: "Philosophie", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "BORA", prenom: "Parfait", cin: "517 011 002 817", contact: "034 86 587 40", grade: "MC", mention: "Technique de l'Environnement", etablissement: "IES-Menabe", statut: "PERM" },
      { nom: "DAUPHIN", prenom: "Rakotondrabe", cin: "501 991 039 091", contact: "032 04 648 85", grade: "A", mention: "Biodiversité", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "DAUPHIN", prenom: "Rakotondrabe", cin: "501 991 039 091", contact: "032 04 648 85", grade: "A", mention: "Sciences de la Vie", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "DIMBY", prenom: "Vaovolo", cin: "515 011 009 104", contact: "330255372", grade: "MC", mention: "Malagasy", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "DINA", prenom: "Alphonse", cin: "101 241 031 777", contact: "034 48 904 53", grade: "PRT", mention: "Sciences de la terre", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "DINA", prenom: "Fotomanantena Jeanne", cin: "101 222 019 646", contact: "320256414", grade: "MC", mention: "Histoire", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "DINA", prenom: "Lagnona Pasigny Hasie", cin: "520 052 015 410", contact: "", grade: "MC", mention: "Droit", etablissement: "DEGS", statut: "PERM" },
      { nom: "DJADAGNA AHY NIRINDRAINIARIVO", prenom: "Philibertin Honoré", cin: "508 991 010 685", contact: "034 76 891 38", grade: "A", mention: "Technique de l'Environnement", etablissement: "IES-Menabe", statut: "PERM" },
      { nom: "FANJIRINDRATOVO", prenom: "Tovondahiniriko", cin: "117 011 001 977", contact: "0342129420", grade: "MC", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "FATIANY", prenom: "Pierre Ruphin", cin: "502 051 001 235", contact: "0343053430", grade: "PR", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "FATIANY", prenom: "Pierre Ruphin", cin: "502 501 001 235", contact: "339038116", grade: "PR", mention: "chimie", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "FENOMANANA", prenom: "Maminirina Sonia", cin: "101 242 088 467", contact: "0346546527", grade: "PRT", mention: "Sciences de Santé", etablissement: "MEDECINE", statut: "PERM" },
      { nom: "FIATOA", prenom: "Barthelemy", cin: "011 003 736", contact: "033 85 202 97", grade: "MC", mention: "Sciences, Technologie et Environnement", etablissement: "CURA", statut: "PERM" },
      { nom: "FIDA", prenom: "Rudy Cyrille", cin: "520 051 003 052", contact: "0341136889", grade: "MC", mention: "Histoire", etablissement: "Fac Lettres", statut: "PERM" },
      { nom: "FIDIARISOAVONINARIVO", prenom: "Andriamananjara Salomon", cin: "109 031 000 057", contact: "034 80 985 00", grade: "A", mention: "Biodiversité", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "FIENENA", prenom: "Joëlson Lucien Christ-Offert", cin: "501 091 000 423", contact: "034 15 503 32", grade: "MC", mention: "Biodiversité", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "FIENENA", prenom: "Raymond François", cin: "508 991 011 059", contact: "0340903469", grade: "MC", mention: "Physique et Applications", etablissement: "SCIENCES", statut: "PERM" },
      { nom: "FIENENA", prenom: "Raymond François", cin: "508 991 011 059", contact: "340903469", grade: "MC", mention: "chimie", etablissement: "SCIENCES", statut: "PERM" },
    ];

    let nextId = 1;
    for (const ens of enseignantsData) {
      enseignants.push({
        id: nextId++,
        nom: ens.nom,
        prenom: ens.prenom,
        cin: ens.cin || null,
        dateCIN: null,
        dateNaissance: null,
        lieuNaissance: null,
        nationalite: "Malagasy",
        adresse: null,
        telephone: ens.contact || null,
        email: null,
        rib: null,
        specialite: ens.mention,
        etablissementPrincipal: ens.etablissement,
        dateRecrutement: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    saveEnseignants(enseignants);
  }

  // Heures, paiements restent vides au départ
  // (ils sont créés par l'utilisateur)
}

// Appel automatique au chargement du module
seedIfEmpty();