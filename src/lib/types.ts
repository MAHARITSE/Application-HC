export interface EnseignantBase {
  id: number;
  nom: string; // MAJUSCULES
  prenom: string | null; // Title Case
  cin: string | null;
  dateCIN: string | null;
  dateNaissance: string | null;
  lieuNaissance: string | null;
  nationalite: string | null;
  adresse: string | null;
  telephone: string | null; // 000 00 000 00
  email: string | null;
  rib: string | null; // 00005 00001 12094250100 09
  specialite: string | null;
  etablissementPrincipal: string | null;
  dateRecrutement: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeureAvecGrade {
  id: number;
  enseignantId: number;
  anneeId: number;
  faculteId: number | null;
  gradeId: number | null;
  statut: "Permanent" | "Vacataire";
  heuresET: number;
  heuresED: number;
  heuresEP: number;
  heuresSoutenance: number;
  heuresRecherche: number;
  obligation: number; // défaut 125, 0 pour vacataire
  // jointures
  gradeCode?: string | null;
  gradeLibelle?: string | null;
  tauxHoraire?: number | null;
  faculte?: {
    id: number;
    etablissement: string;
    domaine: string;
    mention: string;
    parcours: string | null;
    niveau: string | null;
  } | null;
}

export interface EnseignantRow {
  id: number;
  nom: string;
  prenom: string | null;
  nomPrenom: string; // computed for display
  cin: string | null;
  statut: string | null; // dernier statut dans heures de l'année
  gradeCode: string | null; // dernier grade dans heures
  gradeTaux: number | null;
  etablissement: string | null; // etab principal ou faculté
  etablissementPrincipal: string | null;
  total_et: number;
  total_ed: number;
  total_ep: number;
  total_soutenance: number;
  total_recherche: number;
  total_avance: number;
  obligation: number; // obligation appliquée (dernier ou moyenne)
  hcBrut: number;
  hcNette: number;
  hcArrondi: number;
  montantBrut: number;
  irsa: number;
  montantNet: number;
  netAPayer: number;
  rib?: string | null;
  telephone?: string | null;
  email?: string | null;
  specialite?: string | null;
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

export interface Annee {
  id: number;
  libelle: string;
  tranche: string;
  active: boolean;
  appliquerIRSA: boolean;
  tauxIRSA: number;
  plafondPaiement: string | null;
}

export interface Grade {
  id: number;
  code: string;
  libelle: string;
  tauxHoraire: number;
}
