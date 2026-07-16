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
// TABLE 1: Année Universitaire (avec option IRSA)
// ═══════════════════════════════════════════════════════════════════════════
export const annees = pgTable("annees", {
  id: serial("id").primaryKey(),
  libelle: varchar("libelle", { length: 50 }).notNull().unique(),
  tranche: varchar("tranche", { length: 100 }).default("Première tranche"),
  active: boolean("active").default(false),
  appliquerIRSA: boolean("appliquer_irsa").default(true), // Option IRSA par année
  tauxIRSA: real("taux_irsa").default(20), // Taux IRSA en pourcentage
  plafondPaiement: numeric("plafond_paiement", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 2: Grades et Taux horaires
// ═══════════════════════════════════════════════════════════════════════════
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  libelle: varchar("libelle", { length: 100 }).notNull(),
  tauxHoraire: integer("taux_horaire").notNull().default(6000),
  obligationService: integer("obligation_service").notNull().default(0),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 3: Établissements / Facultés
// ═══════════════════════════════════════════════════════════════════════════
export const facultes = pgTable("facultes", {
  id: serial("id").primaryKey(),
  etablissement: varchar("etablissement", { length: 200 }).notNull(),
  mention: varchar("mention", { length: 200 }),
  parcours: varchar("parcours", { length: 200 }),
  niveau: varchar("niveau", { length: 50 }),
  code: varchar("code", { length: 20 }),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 4: Enseignants (informations personnelles)
// ═══════════════════════════════════════════════════════════════════════════
export const enseignants = pgTable("enseignants", {
  id: serial("id").primaryKey(),
  nomPrenom: varchar("nom_prenom", { length: 300 }).notNull(),
  cin: varchar("cin", { length: 50 }),
  dateNaissance: date("date_naissance"),
  lieuNaissance: varchar("lieu_naissance", { length: 200 }),
  nationalite: varchar("nationalite", { length: 100 }).default("Malagasy"),
  adresse: text("adresse"),
  telephone: varchar("telephone", { length: 50 }),
  email: varchar("email", { length: 200 }),
  rib: varchar("rib", { length: 100 }),
  banque: varchar("banque", { length: 100 }),
  statut: varchar("statut", { length: 20 }).notNull().default("Permanent"),
  specialite: varchar("specialite", { length: 200 }),
  gradeId: integer("grade_id").references(() => grades.id),
  etablissementPrincipal: varchar("etablissement_principal", { length: 200 }),
  dateRecrutement: date("date_recrutement"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 5: Heures par enseignant/année/faculté
// ═══════════════════════════════════════════════════════════════════════════
export const heures = pgTable("heures", {
  id: serial("id").primaryKey(),
  enseignantId: integer("enseignant_id").notNull().references(() => enseignants.id, { onDelete: "cascade" }),
  anneeId: integer("annee_id").notNull().references(() => annees.id, { onDelete: "cascade" }),
  faculteId: integer("faculte_id").references(() => facultes.id),
  heuresET: real("heures_et").default(0),
  heuresED: real("heures_ed").default(0),
  heuresEP: real("heures_ep").default(0),
  heuresSoutenance: real("heures_soutenance").default(0),
  heuresRecherche: real("heures_recherche").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 6: Obligations de service (par enseignant/année)
// ═══════════════════════════════════════════════════════════════════════════
export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  enseignantId: integer("enseignant_id").notNull().references(() => enseignants.id, { onDelete: "cascade" }),
  anneeId: integer("annee_id").notNull().references(() => annees.id, { onDelete: "cascade" }),
  heuresObligation: real("heures_obligation").default(0),
  exempte: boolean("exempte").default(false),
  motifExemption: text("motif_exemption"),
});

// ═══════════════════════════════════════════════════════════════════════════
// TABLE 7: Avances et Paiements
// ═══════════════════════════════════════════════════════════════════════════
export const paiements = pgTable("paiements", {
  id: serial("id").primaryKey(),
  enseignantId: integer("enseignant_id").notNull().references(() => enseignants.id, { onDelete: "cascade" }),
  anneeId: integer("annee_id").notNull().references(() => annees.id, { onDelete: "cascade" }),
  montantAvance: real("montant_avance").default(0),
  dateAvance: date("date_avance"),
  pourcentageTranche: real("pourcentage_tranche").default(100),
  montantPaye: real("montant_paye").default(0),
  datePaiement: date("date_paiement"),
  reference: varchar("reference", { length: 100 }),
  statut: varchar("statut", { length: 30 }).default("En attente"),
  createdAt: timestamp("created_at").defaultNow(),
});
