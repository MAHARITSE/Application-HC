# HC-Manager — Application de Gestion des Heures Complémentaires

## Description du Projet

Application web moderne pour gérer les heures complémentaires des enseignants du supérieur à Madagascar. Développée avec Next.js (App Router), PostgreSQL via Drizzle ORM, et Tailwind CSS.

---

## Architecture de la Base de Données

### Tables principales

#### 1. `annees` — Années Universitaires
```sql
- id: serial PRIMARY KEY
- libelle: varchar(50) UNIQUE (ex: "2024-2025")
- tranche: varchar(100) (ex: "Première tranche", "Deuxième tranche")
- active: boolean (année en cours)
- appliquerIRSA: boolean (option IRSA par année)
- tauxIRSA: real (taux en %, défaut 20)
- plafondPaiement: numeric (plafond étatique optionnel)
```

#### 2. `grades` — Grades et Taux Horaires
```sql
- id: serial PRIMARY KEY
- code: varchar(10) UNIQUE (A, MC, PR, PRT)
- libelle: varchar(100)
- tauxHoraire: integer (en Ariary)
```

**Taux par défaut:**
| Grade | Libellé | Taux |
|-------|---------|------|
| A | Assistant | 6 000 Ar |
| MC | Maître de Conférences | 8 000 Ar |
| PR | Professeur | 10 000 Ar |
| PRT | Professeur Titulaire | 12 000 Ar |

#### 3. `facultes` — Structure Académique (Hiérarchie)
```sql
- id: serial PRIMARY KEY
- etablissement: varchar(200) NOT NULL *
- domaine: varchar(200) NOT NULL *
- mention: varchar(200) NOT NULL *
- parcours: varchar(200)
- niveau: varchar(50)
- code: varchar(20)
```

**Règles:**
- Champs obligatoires: Établissement, Domaine, Mention
- Champs optionnels: Parcours, Niveau
- Vérification des doublons avant insertion
- Saisie assistée (autocomplete) pour tous les champs
- Hiérarchie: Établissement → Domaine → Mention → Parcours → Niveau

#### 4. `enseignants` — Base des Enseignants (informations permanentes)
```sql
- id: serial PRIMARY KEY
- nom: varchar(150) NOT NULL          -- Toujours en MAJUSCULES *
- prenom: varchar(200)                 -- Title Case (pas obligatoire)
- cin: varchar(50)
- dateCIN: date                        -- Date de délivrance du CIN
- dateNaissance: date
- lieuNaissance: varchar(200)
- nationalite: varchar(100) DEFAULT 'Malagasy'
- adresse: text                        -- Title Case
- telephone: varchar(20)               -- Format: 000 00 000 00
- email: varchar(200)
- rib: varchar(30)                     -- Format: 00005 00001 12094250100 09
- specialite: varchar(200)
- etablissementPrincipal: varchar(200)
- dateRecrutement: date
```

**⚠️ IMPORTANT:** 
- Le **statut** (Permanent/Vacataire) n'est PAS dans cette table
- Le **grade** n'est PAS dans cette table
- Ces informations sont saisies lors de la saisie des HC car elles peuvent changer

**Règles de formatage:**
- `nom`: Automatiquement converti en MAJUSCULES (obligatoire)
- `prenom`: Title Case - première lettre de chaque mot en majuscule (optionnel)
- `adresse`: Title Case
- `telephone`: Masque de saisie `000 00 000 00`
- `rib`: Masque de saisie `00005 00001 12094250100 09`

#### 5. `heures` — Heures par Année/Enseignant (CONTIENT GRADE ET STATUT)
```sql
- id: serial PRIMARY KEY
- enseignantId: integer REFERENCES enseignants(id) ON DELETE CASCADE
- anneeId: integer REFERENCES annees(id) ON DELETE CASCADE
- faculteId: integer REFERENCES facultes(id)
- gradeId: integer REFERENCES grades(id)    -- Grade AU MOMENT de la saisie
- statut: varchar(20) NOT NULL              -- Permanent | Vacataire AU MOMENT de la saisie
- heuresET: real DEFAULT 0
- heuresED: real DEFAULT 0
- heuresEP: real DEFAULT 0
- heuresSoutenance: real DEFAULT 0
- heuresRecherche: real DEFAULT 0
- obligation: real DEFAULT 125              -- Défaut 125h, 0 pour vacataires
```

**⚠️ IMPORTANT:**
- Le **gradeId** est stocké ICI car un enseignant peut changer de grade au fil des années
- Le **statut** est stocké ICI car il peut aussi changer
- Cela permet de garder l'historique correct des anciennes années
- L'**obligation** est saisie ici (défaut 125h, pas obligatoire, 0 pour vacataires)

#### 6. `paiements` — Avances et Paiements par Tranches
```sql
- id: serial PRIMARY KEY
- enseignantId: integer REFERENCES enseignants(id)
- anneeId: integer REFERENCES annees(id)
- montantAvance: real DEFAULT 0
- dateAvance: date
- pourcentageTranche: real
- montantPaye: real DEFAULT 0
- datePaiement: date
- reference: varchar(100)
- statut: varchar(30) DEFAULT 'En attente'
```

---

## Règles de Gestion

### Calcul des Heures Complémentaires

```
HC Brut = ET + ED + EP + Soutenance + Recherche

Obligation = valeur saisie (défaut 125h, 0 pour vacataires)

Si statut = "Permanent" ET obligation > 0:
    HC Nette = max(0, HC Brut - Obligation)
Sinon (Vacataire ou obligation = 0):
    HC Nette = HC Brut

HC Arrondie = floor(HC Nette)

Montant Brut = HC Arrondie × Taux Horaire (selon grade STOCKÉ dans heures)

Si plafond défini ET Montant Brut > plafond:
    Montant Brut = plafond

Si appliquerIRSA = true:
    IRSA = Montant Brut × (tauxIRSA / 100)
Sinon:
    IRSA = 0

Montant Net = Montant Brut - IRSA
Net à Payer = Montant Net - Total Avances
```

### Pourquoi stocker Grade et Statut dans les Heures?
- Un enseignant Assistant (A) peut devenir Maître de Conférences (MC)
- Un Vacataire peut devenir Permanent
- Les anciennes années doivent garder le grade/statut DE L'ÉPOQUE
- Sinon les calculs seraient faussés rétroactivement

---

## Fonctionnalités de l'Interface

### En-tête
- Logo "HC-Manager"
- Sélecteur d'année (se place sur la DERNIÈRE année au lancement)
- Indicateur de tranche
- Indicateur IRSA (rouge/vert)
- Accès paramètres

### Barre d'outils principale
- 🔍 Recherche
- Filtres (statut, grade)
- **📋 Saisir Heures** — Bouton principal
- **🏛️ Facultés** — Gestion des facultés
- **👥 Enseignants** — Liste de TOUS les enseignants (NOUVEAU)
- **🎓 Grades** — Gestion des grades

### Bouton "Enseignants" (NOUVEAU)
- Affiche la liste complète de TOUS les enseignants de la base
- Recherche par nom/prénom
- Permet de:
  - Voir les détails
  - Modifier les informations (nom, prénom, CIN, contact, RIB...)
  - Supprimer un enseignant
- Utile pour mettre à jour les informations de base

### Bouton "Saisir Heures" (Principal)
- Modal grande taille
- **Étape 1: Rechercher/Créer l'enseignant**
  - Autocomplete sur la base
  - Bouton "Créer" visible directement
  - Si création: formulaire avec infos de base (nom, prénom, contact...)
  
- **Étape 2: Saisir les informations HC**
  - **Grade** * (sélection obligatoire) — stocké dans heures
  - **Statut** * (Permanent/Vacataire) — stocké dans heures
  - Faculté (saisie assistée)
  - Heures: ET, ED, EP, Soutenance, Recherche
  - **Obligation** (défaut 125h, mettre 0 pour vacataire)

### Bouton "Facultés"
- Affiche la liste des facultés/parcours
- Formulaire d'ajout avec saisie assistée:
  - Établissement * (obligatoire)
  - Domaine * (obligatoire)
  - Mention * (obligatoire)
  - Parcours (optionnel)
  - Niveau (optionnel)
- Vérification doublons
- Suppression possible

### Tableau Principal
Colonnes:
- N°
- Nom et Prénoms
- **Grade** (celui stocké dans heures)
- **Statut** (celui stocké dans heures)
- Établissement
- ET, ED, EP, Sout., Rech.
- HC Brut
- Obligation
- HC Net
- Brut (Ar)
- IRSA
- Net (Ar)
- Actions

### Actions par ligne
- ✏️ Modifier (infos enseignant)
- 📊 Heures (gérer les heures)
- 💰 Paiement (préparer paiement)
- 📄 Fiche (générer PDF)
- 🗑️ Supprimer

### Formulaire Enseignant (Informations de base)
**Section Identité:**
- Nom * (MAJUSCULES automatiques)
- Prénom (Title Case, optionnel)
- CIN
- Date CIN
- Date de naissance
- Lieu de naissance
- Nationalité (défaut: Malagasy)

**Section Contact:**
- Téléphone (masque: 000 00 000 00)
- Email
- Adresse (Title Case)
- RIB (masque: 00005 00001 12094250100 09)

**Section Professionnelle:**
- Spécialité
- Établissement principal
- Date de recrutement

**⚠️ PAS de Grade ni Statut ici** — ces infos sont dans la saisie HC

### Formulaire Saisie HC
- Enseignant (recherche/sélection)
- **Grade** * (A, MC, PR, PRT)
- **Statut** * (Permanent, Vacataire)
- Faculté (saisie assistée)
- Heures: ET, ED, EP, Soutenance, Recherche
- **Obligation** (défaut 125h)

---

## Masques de Saisie

| Champ | Format | Exemple | Auto |
|-------|--------|---------|------|
| Nom | MAJUSCULES | RAKOTO | Oui |
| Prénom | Title Case | Jean Pierre | Oui |
| Téléphone | 000 00 000 00 | 034 12 345 67 | Masque |
| RIB | 00005 00001 12094250100 09 | 00005 00001 12094250100 09 | Masque |
| Adresse | Title Case | Lot II A 25 Andravohangy | Oui |

---

## API Routes

| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/seed` | POST | Initialisation |
| `/api/annees` | GET, POST, PUT | Années (avec IRSA) |
| `/api/grades` | GET, PUT | Grades et taux |
| `/api/facultes` | GET, POST, DELETE | Facultés avec vérif doublons |
| `/api/enseignants` | GET, POST | Liste et création |
| `/api/enseignants/[id]` | GET, PUT, DELETE | CRUD enseignant |
| `/api/heures` | GET, POST | Heures (avec grade/statut) |
| `/api/heures/[id]` | PUT, DELETE | Modification heures |
| `/api/paiements` | GET, POST | Paiements |
| `/api/export/fiche` | GET | Fiche individuelle |

---

## Workflow Utilisateur

### 1. Configuration
- Créer/configurer l'année
- Activer/désactiver IRSA
- Vérifier grades et taux

### 2. Gestion Facultés
- Cliquer "Facultés"
- Ajouter: Établissement → Domaine → Mention → Parcours
- Saisie assistée + vérif doublons

### 3. Saisie HC
- Cliquer "Saisir Heures"
- Rechercher enseignant (ou créer)
- **Sélectionner Grade et Statut** (stockés avec les heures)
- Sélectionner faculté
- Saisir heures + obligation

### 4. Mise à jour Enseignant
- Cliquer "Enseignants"
- Rechercher l'enseignant
- Modifier ses infos (contact, RIB, etc.)

### 5. Paiements
- Cliquer 💰 sur un enseignant
- Vérifier détection IRSA/tranche
- Saisir pourcentage
- Valider

### 6. Fiches
- Cliquer 📄
- Saisir N° état
- Imprimer/PDF

---

## Points Clés

| Concept | Explication |
|---------|-------------|
| Grade dans Heures | Permet de garder l'historique si promotion |
| Statut dans Heures | Permet de garder l'historique si changement |
| Obligation dans Heures | Défaut 125h, modifiable, 0 pour vacataire |
| Bouton Enseignants | Pour voir/modifier TOUS les enseignants |
| Saisie assistée | Partout (enseignants, facultés) |
| Vérif doublons | Facultés et enseignants |
| IRSA par année | Activable/désactivable |
| Dernière année | Sélectionnée par défaut au lancement |
