import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  varchar,
  numeric,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 1: Années Universitaires (avec option IRSA par année)
// ═══════════════════════════════════════════════════════════════════════════
export const annees = pgTable("annees", {
  id: serial("id").primaryKey(),
  libelle: varchar("libelle", { length: 50 }).notNull().unique(), // ex: "2024-2025"
  tranche: varchar("tranche", { length: 100 }).default("Première tranche"),
  active: boolean("active").default(false),
  appliquerIRSA: boolean("appliquer_irsa").default(true),
  tauxIRSA: real("taux_irsa").default(20), // en %
  plafondPaiement: numeric("plafond_paiement", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 2: Grades et Taux horaires
// ═══════════════════════════════════════════════════════════════════════════
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // A, MC, PR, PRT
  libelle: varchar("libelle", { length: 100 }).notNull(),
  tauxHoraire: integer("taux_horaire").notNull().default(6000), // en Ariary
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLES 3 à 6: Structure académique normalisée
// Établissement → Domaine → Mention → Parcours
// Chaque niveau est stocké séparément pour éviter la répétition des libellés.
// ═══════════════════════════════════════════════════════════════════════════
export const etablissements = pgTable("etablissements", {
  id: serial("id").primaryKey(),
  etablissement: varchar("etablissement", { length: 200 }).notNull().unique(),
});

export const domaines = pgTable(
  "domaines",
  {
    id: serial("id").primaryKey(),
    etablissementId: integer("etablissement_id")
      .notNull()
      .references(() => etablissements.id, { onDelete: "cascade" }),
    domaine: varchar("domaine", { length: 200 }).notNull(),
  },
  (table) => ({
    uniqueDomaineParEtablissement: uniqueIndex("uniq_domaine_etablissement").on(
      table.etablissementId,
      table.domaine
    ),
  })
);

export const mentions = pgTable(
  "mentions",
  {
    id: serial("id").primaryKey(),
    domaineId: integer("domaine_id")
      .notNull()
      .references(() => domaines.id, { onDelete: "cascade" }),
    mention: varchar("mention", { length: 200 }).notNull(),
  },
  (table) => ({
    uniqueMentionParDomaine: uniqueIndex("uniq_mention_domaine").on(table.domaineId, table.mention),
  })
);

export const parcours = pgTable(
  "parcours",
  {
    id: serial("id").primaryKey(),
    mentionId: integer("mention_id")
      .notNull()
      .references(() => mentions.id, { onDelete: "cascade" }),
    // Facultatif : une mention peut être sélectionnée sans parcours spécifique.
    parcours: varchar("parcours", { length: 200 }),
  },
  (table) => ({
    uniqueParcoursParMention: uniqueIndex("uniq_parcours_mention").on(table.mentionId, table.parcours),
  })
);

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 7: Enseignants - Base permanente (infos d'identité)
// ⚠️ IMPORTANT: Pas de statut ni grade ici, ils sont dans heures
// ═══════════════════════════════════════════════════════════════════════════
export const enseignants = pgTable("enseignants", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 150 }).notNull(), // TOUJOURS MAJUSCULES
  prenom: varchar("prenom", { length: 200 }), // Title Case optionnel
  cin: varchar("cin", { length: 50 }),
  dateCIN: date("date_cin"), // Date délivrance CIN
  dateNaissance: date("date_naissance"),
  lieuNaissance: varchar("lieu_naissance", { length: 200 }),
  nationalite: varchar("nationalite", { length: 100 }).default("Malagasy"),
  adresse: text("adresse"), // Title Case
  telephone: varchar("telephone", { length: 20 }), // Format: 000 00 000 00
  email: varchar("email", { length: 200 }),
  rib: varchar("rib", { length: 30 }), // Format: 00005 00001 12094250100 09
  specialite: varchar("specialite", { length: 200 }),
  etablissementPrincipal: varchar("etablissement_principal", { length: 200 }),
  dateRecrutement: date("date_recrutement"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 8: Heures par Année/Enseignant (CONTIENT GRADE ET STATUT)
// Garde l'historique correct si promotion ou changement de statut
// ═══════════════════════════════════════════════════════════════════════════
export const heures = pgTable("heures", {
  id: serial("id").primaryKey(),
  enseignantId: integer("enseignant_id")
    .notNull()
    .references(() => enseignants.id, { onDelete: "cascade" }),
  anneeId: integer("annee_id")
    .notNull()
    .references(() => annees.id, { onDelete: "cascade" }),
  parcoursId: integer("parcours_id").references(() => parcours.id),
  gradeId: integer("grade_id").references(() => grades.id), // Grade AU MOMENT
  statut: varchar("statut", { length: 20 }).notNull(), // Permanent | Vacataire AU MOMENT
  heuresET: real("heures_et").default(0),
  heuresED: real("heures_ed").default(0),
  heuresEP: real("heures_ep").default(0),
  heuresSoutenance: real("heures_soutenance").default(0),
  heuresRecherche: real("heures_recherche").default(0),
  obligation: real("obligation").default(125), // Défaut 125h, 0 pour vacataires
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 9: Paiements - Avances et Paiements par Tranches
// ═══════════════════════════════════════════════════════════════════════════
export const paiements = pgTable("paiements", {
  id: serial("id").primaryKey(),
  enseignantId: integer("enseignant_id")
    .notNull()
    .references(() => enseignants.id, { onDelete: "cascade" }),
  anneeId: integer("annee_id")
    .notNull()
    .references(() => annees.id, { onDelete: "cascade" }),
  montantAvance: real("montant_avance").default(0),
  dateAvance: date("date_avance"),
  pourcentageTranche: real("pourcentage_tranche"),
  montantPaye: real("montant_paye").default(0),
  datePaiement: date("date_paiement"),
  reference: varchar("reference", { length: 100 }),
  statut: varchar("statut", { length: 30 }).default("En attente"),
  createdAt: timestamp("created_at").defaultNow(),
});
