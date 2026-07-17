// ═══════════════════════════════════════════════════════════════════════════════
// JSON-ONLY DATABASE (remplace PostgreSQL + Drizzle)
// Utilise src/db/jsonStore.ts
// ═══════════════════════════════════════════════════════════════════════════════

import * as jsonStore from "./jsonStore";

// Re-export tout pour compatibilité
export const {
  getAnnees,
  saveAnnees,
  getGrades,
  saveGrades,
  getFacultes,
  saveFacultes,
  getEnseignants,
  saveEnseignants,
  getHeures,
  saveHeures,
  getPaiements,
  savePaiements,

  createAnnee,
  updateAnnee,
  deleteAnnee,
  createGrade,
  updateGrade,
  createFaculte,
  updateFaculte,
  deleteFaculte,
  createEnseignant,
  updateEnseignant,
  deleteEnseignant,
  createHeure,
  updateHeure,
  deleteHeure,
  createPaiement,
  deletePaiement,

  seedIfEmpty,
} = jsonStore;

// Types
export type { Annee, Grade, Faculte, Enseignant, Heure, Paiement } from "./jsonStore";

// Pour compatibilité avec l'ancien code qui fait `import { db } from "@/db"`
// On fournit un stub qui redirige vers jsonStore (on ne l'utilise plus directement)
export const db = {
  // Placeholder pour éviter les crashes pendant la migration complète
  // Les routes API doivent maintenant utiliser directement les helpers du jsonStore
  _jsonOnly: true,
  _message: "PostgreSQL supprimé. Utilisation de JSON uniquement via jsonStore.",
};

// On garde aussi pool pour éviter les erreurs d'import
export const pool = null as any;

console.log("✅ Application en mode JSON-only (data/*.json) - PostgreSQL désactivé");
