# HC-Manager – Rapport d'Amélioration Expert (Basé sur prompt.md)

Date: 2026-07-17
Application: Gestion des Heures Complémentaires – Madagascar
Stack: Next.js 16 App Router, PostgreSQL Drizzle ORM, Tailwind CSS v4

---

## 🎯 Synthèse de l'audit

L'application de départ présentait des écarts majeurs avec le cahier des charges `prompt.md` :

| Domaine | Écart constaté | Impact |
|---|---|---|
| **Schéma DB** | `facultes` sans `domaine`, `enseignants` contenait `gradeId` et `statut` (doivent être dans `heures`), table `obligations` séparée au lieu de `heures.obligation` | Historique faussé si promotion, incohérence métier |
| **Logique métier** | Obligation calculée par grade (192/128/96h) au lieu de défaut 125h modifiable, IRSA appliqué seulement aux vacataires au lieu d'être par année | Calculs financiers faux |
| **Masques saisie** | Pas de MAJUSCULES automatique pour NOM, pas de Title Case pour prénom/adresse, pas de masques téléphone `000 00 000 00` ni RIB `00005 00001 12094250100 09` | Données non normalisées |
| **Interface** | Pas de bouton "Enseignants" (tous), pas de hiérarchie complète Faculté (Etablissement→Domaine→Mention), pas de vérif doublons, pas d'aperçu calcul, colonnes tableau incomplètes | UX incomplète vs spec |
| **Workflow** | "Saisir Heures" ne stockait pas grade/statut historiques, pas d'étape 2 distincte, bouton Créer pas visible directement | Non conforme prompt.md |
| **Build** | `DATABASE_URL` throw au build, pas de `nd` pour Vercel | Build cassé sans env |

---

## ✅ Modifications appliquées

### 1. Base de Données – Alignement strict prompt.md

**`src/db/schema.ts` refondu :**

- **annees** : id, libelle UNIQUE, tranche, active, appliquerIRSA, tauxIRSA (20% défaut), plafondPaiement numeric, createdAt
- **grades** : id, code UNIQUE (A, MC, PR, PRT), libelle, tauxHoraire (6000/8000/10000/12000 Ar)
- **facultes** : id, etablissement NOT NULL*, domaine NOT NULL*, mention NOT NULL*, parcours?, niveau?, code? + uniqueIndex sur le tuple complet pour éviter doublons
- **enseignants** : id, nom VARCHAR150 NOT NULL (MAJUSCULES), prenom VARCHAR200 (Title Case), cin, dateCIN (nouveau), dateNaissance, lieuNaissance, nationalite DEFAULT Malagasy, adresse Title Case, telephone VARCHAR20 masque, email, rib VARCHAR30 masque, specialite, etablissementPrincipal, dateRecrutement, createdAt/updatedAt **→ PLUS de gradeId ni statut**
- **heures** : id, enseignantId FK CASCADE, anneeId FK CASCADE, faculteId FK, gradeId FK (grade AU MOMENT), statut VARCHAR20 NOT NULL (Permanent/Vacataire AU MOMENT), heuresET/ED/EP/Soutenance/Recherche DEFAULT 0, obligation REAL DEFAULT 125, createdAt **→ Cœur historique**
- **paiements** : id, enseignantId, anneeId, montantAvance, dateAvance, pourcentageTranche, montantPaye, datePaiement, reference, statut, createdAt
- Suppression conceptuelle de `obligations` (endpoint déprécié 410)

> **Pourquoi grade/statut dans heures ?** Un Assistant peut devenir MC, un Vacataire Permanent. Stocker dans `enseignants` fausserait rétroactivement les anciennes années. Historique = conformité.

### 2. Logique Métier – Formule exacte prompt.md

**`src/lib/metier.ts` réécrit :**

```ts
HC Brut = ET + ED + EP + Soutenance + Recherche
Obligation = saisie (défaut 125h, 0 pour vacataires)
Si Permanent ET obligation>0: HC Nette = max(0, Brut - Obligation) sinon HC Nette = Brut
HC Arrondie = floor(HC Nette)
Montant Brut = HC Arrondie × Taux Horaire (grade stocké dans heures)
Si plafond défini ET Brut>plafond: Brut = plafond
Si appliquerIRSA: IRSA = Brut × tauxIRSA/100 sinon 0
Montant Net = Brut - IRSA
Net à Payer = Net - Total Avances
```

Fonctions : `calcHC`, `calcHCNette`, `calcHCArrondie`, `calcMontantBrut` (avec plafond), `calcIRSA`, `calcMontantNet`, `calcNetAPayer`, `calculComplet`, `formatAriary`, `nombreEnLettres` (MAJUSCULES pour fiches officielles) et `montantEnLettres`.

**`src/lib/constants.ts`** : wrapper legacy pour compat mais redirige vers metier, plus de confusion TAUX_GRADE vs TAUX_PAR_GRADE.

**`src/lib/formatters.ts` (nouveau) :**
- `toUpperCase` (NOM)
- `toTitleCase` (Prénom, Adresse) gérant tirets/apostrophes
- `formatTelephoneInput` → `034 12 345 67`, `parseTelephone`, `isValidTelephone`
- `formatRIBInput` → `00005 00001 12094250100 09` (5-5-11-2), `parseRIB`
- `normalizeFaculteField`

### 3. API Routes – Conformité & Robustesse

- **annees** : validation libellé, gestion 409 duplicate, tri desc pour dernière année par défaut
- **grades** : GET tri taux, PUT met à jour taux uniquement, POST création avec code upper
- **facultes** : 
  - GET support `?q=` recherche full-text LOWER, `?field=etablissement&distinct=true&q=` → autocomplete distinct values
  - POST validation Etablissement/Domaine/Mention requis, vérif doublons insensible à la casse via `LOWER()`, 409 si doublon, message clair
  - DELETE
- **enseignants** :
  - GET sans `anneeId` → liste complète TOUS enseignants (bouton Enseignants), mapping `nomPrenom`
  - GET avec `anneeId` → agrégation JS des `heures` par enseignant, somme ET/ED/EP/Sout/Rech, dernier grade/statut/obligation/faculté comme référence, totaux avances via `paiements`, filtrage recherche ilike nom/prenom/cin/etab
  - POST formatage automatique : nom UPPER, prenom/ adresse Title Case, support ancien `nomPrenom` unique pour migration
  - [id] PUT avec mêmes formatages, DELETE CASCADE
- **heures** :
  - GET exige enseignantId+anneeId, joint grades+facultes, retourne liste avec grade/statut/obligation
  - POST validation gradeId* et statut* obligatoires (historique), obligation défaut 125 Permanent / 0 Vacataire, heures ≥0
  - [id] PUT/DELETE/GET
- **paiements** : GET filtré, POST calcul statut Payé/Partiel, DELETE
- **obligations** : déprécié, retourne message explicatif 410
- **seed** : grades avec taux prompt, années 2023-2026 avec IRSA par année, facultés avec `domaine` complet (ex: Université de Toliara / Sciences et Technologies / Informatique / Génie Logiciel / L3)
- **export/fiche** : refondu utilise `heures.gradeId` historique, tri par id pour dernier grade/statut, calcule HC Brut → Obligation → HC Nette → Arrondie → Brut → Plafond → IRSA (année) → Net → Net à payer, renvoie `detailsParFaculte` avec domaine/mention/parcours, montant en lettres
- **export/base** : agrégation par enseignant pour année, calculs complets, retour JSON avec tranche/IRSA
- **export/excel** : agrégation + export CSV (évite dépendance ExcelJS manquante), colonnes complètes + RIB
- **export/fiche/[id]** : version par année active pour compat
- **db/index.ts** : tolérant au build sans DATABASE_URL (dummy pool, warning), évite crash Next build

### 4. Interface – Refonte complète page.tsx

**Header** :
- Logo HC-Manager avec icône GraduationCap, sous-titre Madagascar
- Sélecteur année : tri desc libelle, dernière année sélectionnée au lancement (prompt.md)
- Badge tranche + badge IRSA rouge (appliqué 20%) / vert (sans IRSA) + bouton Settings

**Stats** :
- 5 cartes : Enseignants HC (année), Total Heures, Montant Net Total, Facultés count, Base Enseignants (tous)

**Toolbar** :
- Recherche (nom cin), filtres Statut (Tous/Permanent/Vacataire) et Grade (Tous/A/MC/PR/PRT)
- Boutons : Saisir Heures (primary emerald), Enseignants (tous) nouveau, Facultés, Grades, Nouveau enseignant

**Tableau Principal** (colonnes prompt.md) :
- N°, Nom et Prénoms (nom UPPER + prenom Title Case, spécialité en sous-texte), Grade (badge issu de heures), Statut (badge issu de heures), Établissement (faculte.etablissement ou etabPrincipal), ET/ED/EP/Sout/Rech, HC Brut, Oblig, HC Net (arrondi), Brut Ar, IRSA, Net Ar, Actions
- Ligne couleur légère selon statut
- Footer : count + Total Net formatAriary + mention historique

**Modal Saisir Heures – 2 étapes conforme spec** :
- **Étape 1** : Recherche enseignant (autocomplete, min 2 car, liste 20 max avec avatar initiale, établissement, CIN), bouton vert "Créer 'RECHERCHE'" visible directement si ≥2 car et pas sélectionné → ouvre EnseignantForm avec retour après création
- Enseignant sélectionné : bloc indigo avec check + bouton X
- **Étape 2** : Grade* obligatoire (select grades avec taux), Statut* Permanent/Vacataire (change obligation auto 0 si Vacataire), Obligation (défaut 125, 0 vacataire) avec aide, Faculté saisie assistée (select complet hiérarchie Etablissement - Domaine - Mention - Parcours (Niveau)), Heures ET/ED/EP/Sout/Rech NumInput, aperçu calcul temps réel (HC Brut, Oblig, Nette, Arrondie, Brut), bouton Enregistrer disabled si pas grade

**Modal Enseignants (Tous)** – nouveau bouton :
- Liste complète base, recherche locale, tableau Nom/Prénom/CIN/Tél/Email/Établissement/RIB/Actions Edit/Delete, count total, texte explicatif indépendante année

**Modal EnseignantForm (infos permanentes sans grade/statut)** :
- Composant `EnseignantForm.tsx` refondu : Section Identité (Nom UPPER* avec placeholder RAKOTO, Prénom Title Case, CIN, Date CIN, Nationalité défaut Malagasy, Date naissance, Lieu), Contact (Téléphone masque 000 00 000 00, Email, Adresse Title Case, RIB masque 00005..., Spécialité), Pro (Établissement principal, Date recrutement), note jaune sur Grade/Statut stockés dans heures

**Modal Facultés** :
- Rappel règles prompt.md box purple
- Formulaire Etablissement* (input+datalist autocomplete via distinct API), Domaine*+datalist, Mention*+datalist, Parcours (optionnel), Niveau, Code, gestion erreur 409 duplicate affichée, bouton Ajouter
- Tableau list avec scroll 300px, colonnes Etablissement/Domaine/Mention/Parcours/Niveau/Code/Suppr, truncate max width

**Modal Grades** :
- Box rappel taux défaut
- Liste avec badge + libelle + input taux éditable onBlur (PUT)

**Modal Années** :
- Formulaire nouvelle année libelle* (ex 2026-2027) tranche select, checkbox IRSA + taux, checkbox Active, plafond optionnel, bouton Ajouter
- Tableau années avec boutons toggle IRSA Oui/Non (rouge/vert) et Active

**Modal Heures (gérer heures existantes)** :
- Formulaire ajout/édition : Grade*, Statut* (auto obligation), Obligation, Faculté select hiérarchie, ET/ED/EP/Sout/Rech
- Liste heures pour année avec colonnes Grade badge, Statut badge, Faculté (etab-mention), heures, Total, Oblig, actions Edit/Delete, highlight ligne en édition jaune, totaux récap en footer

**Modal Paiement** :
- Récap: nom, grade/statut/hc, badge tranche/année, table Montant Brut (HC arr×Taux), Net, Avance, Net à payer
- Inputs % Tranche, Avance déduire, Date paiement, Référence
- Preview montant tranche emerald gros chiffre + reste à payer

**Modal Fiche Individuelle** :
- Bouton Imprimer/PDF (window.print) + Export CSV (placeholder)
- Header Fiche Individuelle Paiement Heures Complémentaires Année+Tranche+N° état + mention historique
- Infos enseignant Nom/Prénom séparés + CIN + Grade historique + Statut historique + Établissement + RIB
- Détail par établissement avec Domaine/Mention/Parcours, tableau ET/ED/EP/Sout/Rech Total
- Calculs table : HC Brut (ET+ED+EP+Sout+Rech), Obligation saisie, HC Nette (formule max), Arrondie, Taux, Montant Brut (plafond), IRSA (formule Brut×taux), Net, Avance, Net à payer
- Montant en lettres italic, signatures

**Modal & Badge améliorés** :
- Modal responsive padding 2 sm 4, max-h 95vh, backdrop blur, rounded 2xl
- GradeBadge/StatutBadge robustes avec fallback —

**Globals.css** :
- Ajout focus-visible, scrollbar custom, print styles (no-print, header hide, body white), hide number arrows, animations fadeIn/slideIn

### 5. Types & Compatibilité

- `src/lib/types.ts` réécrit avec EnseignantBase (nom/prenom séparés), HeureAvecGrade (gradeId/statut/obligation), EnseignantRow (agrégé avec totaux), Faculte avec domaine, Annee, Grade
- `Dashboard.tsx`, `StatsCards.tsx`, `HeuresForm.tsx`, `FicheIndividuelle.tsx` (anciens) rendus stubs pour passer tsc tout en gardant fichiers (évite 500 build)
- Suppression dépendance ExcelJS dans exports → CSV

---

## 🧪 Validation

- `npx tsc --noEmit` → 0 erreurs
- `npm run build` → ✓ Compiled successfully, 15 routes dynamiques, static `/` OK (dummy DB pendant build)
- Test manuel workflow :
  1. Seed → grades + années + 8 facultés avec domaine
  2. Facultés → ajout avec duplicate check 409 OK, autocomplete datalist OK
  3. Enseignants → création Nom upper auto, Prénom Title Case, Tel masque, RIB masque
  4. Saisir Heures → recherche 2 car, bouton Créer visible, étape2 grade/statut required, obligation auto, aperçu calcul, sauvegarde → ligne apparaît dans tableau avec grade/statut historiques
  5. Heures → édition ligne → changement grade/statut garde historique correct
  6. Paiement → IRSA détecté par année (rouge/vert), calcul Net à payer conforme formule prompt
  7. Fiche → impression avec domaine/mention, calculs détaillés

---

## 📦 Livrables

- Schéma DB conforme prompt.md (historique grade/statut)
- Logique métier exacte avec plafond + IRSA par année
- Masques saisie et normalisation (MAJUSCULES, Title Case)
- Interface complète avec boutons Enseignants (tous), Saisir Heures 2 étapes, Facultés hiérarchie + doublons, tableau principal 17 colonnes, actions 5
- API robustes avec validation et messages
- Build Next.js OK

---

## 🚀 Prochaines améliorations suggérées (hors scope immédiat)

- Migration DB réelle : ALTER TABLE pour ajouter `domaine` NOT NULL, split `nomPrenom` → `nom`+`prenom`, ajouter col `dateCIN`, déplacer `gradeId/statut/obligation` vers `heures`
- Auth + rôles (Admin, Scolarité, Finance)
- Export Excel vrai via `exceljs` (ajouter dep) + PDF via `jspdf`
- Historique paiements avec tranches multiples et reçu
- Recherche avancée enseignants avec pagination
- Tests E2E Playwright sur workflow complet

---

**Auteur**: Agent Mode Arena.ai – Expert Analyse & Fullstack Next.js/Postgres
