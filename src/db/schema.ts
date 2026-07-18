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
// TABLE 3: Structure Académique - Facultés / Établissements
// Hiérarchie: Établissement → Domaine → Mention → Parcours
// ═══════════════════════════════════════════════════════════════════════════
export const facultes = pgTable(
  "facultes",
  {
    id: serial("id").primaryKey(),
    etablissement: varchar("etablissement", { length: 200 }).notNull(),
    domaine: varchar("domaine", { length: 200 }).notNull(),
    mention: varchar("mention", { length: 200 }).notNull(),
    parcours: varchar("parcours", { length: 200 }),
    code: varchar("code", { length: 20 }),
  },
  (table) => ({
    // Unicité logique pour éviter doublons exacts
    uniqueFac: uniqueIndex("uniq_fac_full").on(
      table.etablissement,
      table.domaine,
      table.mention,
      table.parcours
    ),
  })
);

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 4: Enseignants - Base permanente (infos d'identité)
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
  gradeId: integer("grade_id").references(() => grades.id), // Grade AU MOMENT de la saisie (base enseignant)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 5: Heures par Année/Enseignant (CONTIENT GRADE ET STATUT)
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
  faculteId: integer("faculte_id").references(() => facultes.id),
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
// TABLE 6: Paiements - Avances et Paiements par Tranches
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
