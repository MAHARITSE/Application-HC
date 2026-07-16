import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  timestamp,
  text,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================
// 1. ANNÉE UNIVERSITAIRE (année de référence)
// ============================================
export const anneesUniversitaires = pgTable("annees_universitaires", {
  id: serial("id").primaryKey(),
  annee: varchar("annee", { length: 20 }).notNull().unique(), // ex: "2025-2026"
  dateDebut: date("date_debut").notNull(),
  dateFin: date("date_fin").notNull(),
  estActive: integer("est_active").default(1), // 1 = active, 0 = fermée
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// 2. INFORMATIONS PERSONNELLES ENSEIGNANT
// ============================================
export const enseignants = pgTable("enseignants", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 100 }).notNull(),
  prenoms: varchar("prenoms", { length: 150 }).notNull(),
  cin: varchar("cin", { length: 20 }).notNull().unique(),
  dateNaissance: date("date_naissance"),
  lieuNaissance: varchar("lieu_naissance", { length: 100 }),
  nationalite: varchar("nationalite", { length: 50 }).default("Malagasy"),
  rib: varchar("rib", { length: 50 }).notNull(),
  banque: varchar("banque", { length: 100 }),
  telephone: varchar("telephone", { length: 20 }),
  email: varchar("email", { length: 150 }),
  adresse: text("adresse"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// 3. GRADES + MONTANT (tarif horaire)
// ============================================
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // MC, PR, PRT, A, etc.
  libelle: varchar("libelle", { length: 100 }).notNull(),  // Maître de Conférences, Professeur, etc.
  montantET: numeric("montant_et", { precision: 12, scale: 2 }).notNull(), // Tarif ET
  montantED: numeric("montant_ed", { precision: 12, scale: 2 }).notNull(),
  montantEP: numeric("montant_ep", { precision: 12, scale: 2 }).notNull(),
  montantSoutenance: numeric("montant_soutenance", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// 4. AFFECTATIONS HEURES (année + enseignant + faculté + parcours)
// ============================================
export const affectationsHeures = pgTable("affectations_heures", {
  id: serial("id").primaryKey(),
  anneeId: integer("annee_id").notNull().references(() => anneesUniversitaires.id),
  enseignantId: integer("enseignant_id").notNull().references(() => enseignants.id),
  gradeId: integer("grade_id").notNull().references(() => grades.id),
  statut: varchar("statut", { length: 20 }).notNull(), // Permanent, Vacataire

  // Faculté + Parcours
  faculteId: integer("faculte_id").notNull().references(() => facultes.id),
  parcoursId: integer("parcours_id").notNull().references(() => parcours.id),

  // Heures
  heuresET: numeric("heures_et", { precision: 10, scale: 2 }).default("0"),
  heuresED: numeric("heures_ed", { precision: 10, scale: 2 }).default("0"),
  heuresEP: numeric("heures_ep", { precision: 10, scale: 2 }).default("0"),
  heuresSoutenance: numeric("heures_soutenance", { precision: 10, scale: 2 }).default("0"),
  heuresRecherche: numeric("heures_recherche", { precision: 10, scale: 2 }).default("0"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAffectation: uniqueIndex("unique_affectation").on(
    table.anneeId, table.enseignantId, table.faculteId, table.parcoursId
  ),
}));

// ============================================
// 5. FACULTÉS + MENTIONS + PARCOURS
// ============================================
export const facultes = pgTable("facultes", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 150 }).notNull().unique(), // ex: "Faculté des Sciences"
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mentions = pgTable("mentions", {
  id: serial("id").primaryKey(),
  faculteId: integer("faculte_id").notNull().references(() => facultes.id),
  nom: varchar("nom", { length: 150 }).notNull(), // ex: "Informatique", "Mathématiques"
  code: varchar("code", { length: 20 }).notNull(),
});

export const parcours = pgTable("parcours", {
  id: serial("id").primaryKey(),
  mentionId: integer("mention_id").notNull().references(() => mentions.id),
  nom: varchar("nom", { length: 150 }).notNull(), // ex: "L3 Informatique", "M1 GL"
  code: varchar("code", { length: 20 }).notNull(),
  niveau: varchar("niveau", { length: 20 }), // L1, L2, L3, M1, M2...
});

// Types exportés
export type AnneeUniversitaire = typeof anneesUniversitaires.$inferSelect;
export type NewAnneeUniversitaire = typeof anneesUniversitaires.$inferInsert;

export type Enseignant = typeof enseignants.$inferSelect;
export type NewEnseignant = typeof enseignants.$inferInsert;

export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;

export type AffectationHeures = typeof affectationsHeures.$inferSelect;
export type NewAffectationHeures = typeof affectationsHeures.$inferInsert;

export type Faculte = typeof facultes.$inferSelect;
export type NewFaculte = typeof facultes.$inferInsert;

export type Mention = typeof mentions.$inferSelect;
export type NewMention = typeof mentions.$inferInsert;

export type Parcours = typeof parcours.$inferSelect;
export type NewParcours = typeof parcours.$inferInsert;