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
  // Structure académique normalisée : Établissement → Domaine → Mention → Parcours
  getEtablissements,
  saveEtablissements,
  getDomaines,
  saveDomaines,
  getMentions,
  saveMentions,
  getParcours,
  saveParcours,
  // Vue aplatie réservée aux listes et exports de l'application actuelle.
  getStructures,
  saveStructures,
  createStructure,
  createEtablissement,
  createDomaine,
  createMention,
  updateStructure,
  deleteStructure,
  // Alias historiques : conservés pour les migrations externes.
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
export type {
  Annee,
  Grade,
  Faculte,
  StructureAcademique,
  Etablissement,
  Domaine,
  Mention,
  Parcours,
  Enseignant,
  Heure,
  Paiement,
} from "./jsonStore";

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
