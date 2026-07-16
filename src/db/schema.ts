import {
  pgTable,
  serial,
  text,
  integer,
  real,
  date,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════════════════════════════
// BASE 1 — Années Universitaires
// ═══════════════════════════════════════════════════════════════════════════════
export const anneesUniversitaires = pgTable("annees_universitaires", {
  id: serial("id").primaryKey(),
  libelle: text("libelle").notNull().unique(),       // ex: "2019/2020"
  dateDebut: date("date_debut"),
  dateFin: date("date_fin"),
  tranche: text("tranche").default("Première tranche"),
  active: boolean("active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// BASE 3 — Grades et Taux horaires
// ═══════════════════════════════════════════════════════════════════════════════
export const gradesTaux = pgTable("grades_taux", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),             // A, MC, PR, PRT
  libelle: text("libelle").notNull(),                // Assistant, Maître de Conf, ...
  tauxHoraire: integer("taux_horaire").notNull(),    // en Ariary
  obligationService: integer("obligation_service").default(0), // h/an pour permanents
});

// ═══════════════════════════════════════════════════════════════════════════════
// BASE 5 — Facultés / Mentions / Parcours
// ═══════════════════════════════════════════════════════════════════════════════
export const facultesParcours = pgTable("facultes_parcours", {
  id: serial("id").primaryKey(),
  etablissement: text("etablissement").notNull(),    // ex: SCIENCES, MEDECINE...
  mention: text("mention"),                          // ex: Mathématiques
  parcours: text("parcours"),                        // ex: Algèbre et Géométrie
  niveau: text("niveau"),                            // L, M, D
  code: text("code").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// BASE 2 — Enseignants (données personnelles)
// ═══════════════════════════════════════════════════════════════════════════════
export const enseignants = pgTable("enseignants", {
  id: serial("id").primaryKey(),
  nomPrenom: text("nom_prenom").notNull(),
  cin: text("cin").unique(),
  dateNaissance: date("date_naissance"),
  lieuNaissance: text("lieu_naissance"),
  nationalite: text("nationalite").default("Malgache"),
  adresse: text("adresse"),
  telephone: text("telephone"),
  email: text("email"),
  rib: text("rib"),
  banque: text("banque"),
  statut: text("statut").notNull(),                  // Permanent | Vacataire
  specialite: text("specialite"),
  gradeId: integer("grade_id").references(() => gradesTaux.id),
  etablissementPrincipal: text("etablissement_principal"),
  dateRecrutement: date("date_recrutement"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// BASE 4 — Heures d'enseignement
//   (par année universitaire, par enseignant, par faculté/parcours)
// ═══════════════════════════════════════════════════════════════════════════════
export const heuresEnseignement = pgTable(
  "heures_enseignement",
  {
    id: serial("id").primaryKey(),
    anneeId: integer("annee_id")
      .notNull()
      .references(() => anneesUniversitaires.id),
    enseignantId: integer("enseignant_id")
      .notNull()
      .references(() => enseignants.id),
    faculteParcoursId: integer("faculte_parcours_id").references(
      () => facultesParcours.id
    ),
    etablissement: text("etablissement"),             // établissement où enseigne
    niveau: text("niveau"),                           // L1, L2, M1...
    et: real("et").default(0),                        // Enseignement Théorique
    ed: real("ed").default(0),                        // Enseignement Dirigé
    ep: real("ep").default(0),                        // Enseignement Pratique
    soutenance: real("soutenance").default(0),
    recherche: real("recherche").default(0),
    avance: real("avance").default(0),                // montant avance versée
    dateAvance: date("date_avance"),
    numeroEtat: text("numero_etat"),
    tranche: text("tranche").default("Première tranche"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniq: unique().on(t.anneeId, t.enseignantId, t.etablissement, t.niveau),
  })
);
