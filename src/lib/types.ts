export interface EnseignantRow {
  id: number;
  nom: string;
  prenoms: string;
  grade: string;
  etablissement: string;
  statut: string;
  heuresET: string;
  heuresED: string;
  heuresEP: string;
  heuresSoutenance: string;
  heuresRecherche: string;
  rib: string;
  avance: string;
  dateAvance: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnseignantFormData {
  nom: string;
  prenoms: string;
  grade: string;
  etablissement: string;
  statut: string;
  heuresET: number;
  heuresED: number;
  heuresEP: number;
  heuresSoutenance: number;
  heuresRecherche: number;
  rib: string;
  avance: number;
  dateAvance: string;
}
