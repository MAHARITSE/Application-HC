# HC-Manager — Application de Gestion des Heures Complémentaires

## Description du Projet

Application web moderne pour gérer les heures complémentaires des enseignants du supérieur à Madagascar. Développée avec Next.js (App Router), PostgreSQL via Drizzle ORM, et Tailwind CSS.

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
- obligationService: integer (heures d'obligation)
```

**Taux par défaut:**
| Grade | Libellé | Taux | Obligation |
|-------|---------|------|------------|
| A | Assistant | 6 000 Ar | 192h |
| MC | Maître de Conférences | 8 000 Ar | 128h |
| PR | Professeur | 10 000 Ar | 96h |
| PRT | Professeur Titulaire | 12 000 Ar | 96h |

#### 3. `facultes` — Structure Académique
```sql
- id: serial PRIMARY KEY
- etablissement: varchar(200) (Faculté des Sciences, ENS, etc.)
- mention: varchar(200)
- parcours: varchar(200)
- niveau: varchar(50) (L1, L2, L3, M1, M2)
- code: varchar(20)
```

#### 4. `enseignants` — Base des Enseignants (permanente)
```sql
- id: serial PRIMARY KEY
- nomPrenom: varchar(300) NOT NULL
- cin: varchar(50)
- dateNaissance: date
- lieuNaissance: varchar(200)
- nationalite: varchar(100)
- adresse: text
- telephone: varchar(50)
- email: varchar(200)
- rib: varchar(100)
- banque: varchar(100)
- statut: varchar(20) (Permanent | Vacataire)
- specialite: varchar(200)
- gradeId: integer REFERENCES grades(id)
- etablissementPrincipal: varchar(200)
- dateRecrutement: date
```

#### 5. `heures` — Heures par Année/Enseignant/Faculté
```sql
- id: serial PRIMARY KEY
- enseignantId: integer REFERENCES enseignants(id) ON DELETE CASCADE
- anneeId: integer REFERENCES annees(id) ON DELETE CASCADE
- faculteId: integer REFERENCES facultes(id)
- heuresET: real (Enseignement Théorique)
- heuresED: real (Enseignement Dirigé)
- heuresEP: real (Enseignement Pratique)
- heuresSoutenance: real
- heuresRecherche: real
```

#### 6. `obligations` — Obligation de Service par Année
```sql
- id: serial PRIMARY KEY
- enseignantId: integer REFERENCES enseignants(id)
- anneeId: integer REFERENCES annees(id)
- heuresObligation: real (personnalisable, défaut selon grade)
- exempte: boolean (si responsabilité administrative)
- motifExemption: text
```

#### 7. `paiements` — Avances et Paiements par Tranches
```sql
- id: serial PRIMARY KEY
- enseignantId: integer REFERENCES enseignants(id)
- anneeId: integer REFERENCES annees(id)
- montantAvance: real
- dateAvance: date
- pourcentageTranche: real (ex: 50%, 100%)
- montantPaye: real
- datePaiement: date
- reference: varchar(100)
- statut: varchar(30) (En attente | Partiel | Payé)
```

## Règles de Gestion

### Calcul des Heures Complémentaires

```
HC Brut = ET + ED + EP + Soutenance + Recherche

Si statut = "Permanent" ET non exempté:
    HC Nette = max(0, HC Brut - Obligation)
Sinon:
    HC Nette = HC Brut

HC Arrondie = floor(HC Nette)  // Arrondi à l'entier inférieur

Montant Brut = HC Arrondie × Taux Horaire (selon grade)

Si plafond défini ET Montant Brut > plafond:
    Montant Brut = plafond

Si appliquerIRSA = true:
    IRSA = Montant Brut × (tauxIRSA / 100)
Sinon:
    IRSA = 0

Montant Net = Montant Brut - IRSA
Net à Payer = Montant Net - Total Avances
```

### Option IRSA par Année
- Chaque année universitaire peut avoir l'IRSA activé ou non
- Le taux IRSA est configurable (défaut: 20%)
- L'indicateur visuel dans l'en-tête montre le statut IRSA

### Paiement par Tranches
- Possibilité de payer en plusieurs tranches (ex: 50%, puis 50%)
- Gestion des avances avec date
- Suivi du statut de paiement (En attente, Partiel, Payé)

### Plafonnement
- L'État peut définir un plafond maximum par enseignant/année
- Si le montant brut dépasse le plafond, il est plafonné

## Fonctionnalités de l'Interface

### En-tête
- Logo et nom de l'application
- Sélecteur d'année universitaire (se place sur la dernière année au lancement)
- Indicateur IRSA (rouge si actif, vert si non)
- Accès aux paramètres

### Tableau de Bord
- Cartes statistiques (enseignants, heures, montant, facultés, grades)
- Barre de recherche par nom ou établissement
- Filtres par statut et grade
- Tableau récapitulatif avec toutes les colonnes

### Actions par Enseignant
- ✏️ Modifier les informations
- 📊 Gérer les heures (par faculté/parcours)
- 📄 Générer la fiche individuelle
- 💰 Préparer le paiement
- 🗑️ Supprimer

### Modals
1. **Enseignant**: Formulaire complet avec saisie assistée
2. **Heures**: Ventilation par faculté (ET, ED, EP, Sout., Rech.)
3. **Fiche Individuelle**: PDF imprimable
4. **Préparation Paiement**: Pourcentage, détection automatique IRSA/tranche
5. **Facultés**: CRUD établissements/parcours
6. **Années**: Configuration IRSA, plafond, tranche
7. **Grades**: Modification taux et obligations

### Fiche Individuelle de Paiement
- En-tête avec année et numéro d'état
- Informations enseignant
- Détail des heures par établissement
- Calcul complet (brut, IRSA, net)
- Montant en toutes lettres
- Zone signatures

## Technologies

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: API Routes Next.js
- **Base de données**: PostgreSQL avec Drizzle ORM
- **Icônes**: Lucide React
- **Impression**: CSS @media print

## API Routes

| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/seed` | POST | Initialisation de la base |
| `/api/annees` | GET, POST, PUT | Gestion des années |
| `/api/grades` | GET, PUT | Gestion des grades |
| `/api/facultes` | GET, POST, DELETE | Gestion des facultés |
| `/api/enseignants` | GET, POST | Liste et création enseignants |
| `/api/enseignants/[id]` | GET, PUT, DELETE | CRUD enseignant |
| `/api/heures` | GET, POST | Heures par enseignant/année |
| `/api/heures/[id]` | PUT, DELETE | Modification/suppression heures |
| `/api/obligations` | GET, POST | Obligations de service |
| `/api/paiements` | GET, POST | Gestion des paiements |
| `/api/export/fiche` | GET | Génération fiche individuelle |

## Installation et Lancement

```bash
# Installation des dépendances
npm install

# Configuration base de données
# Créer .env avec DATABASE_URL=postgresql://...

# Appliquer le schéma
npx drizzle-kit push

# Lancer le serveur de développement
npm run dev

# Build production
npm run build
npm start
```

## Workflow Utilisateur Typique

1. **Configuration initiale**
   - Créer/configurer l'année universitaire
   - Activer/désactiver IRSA, définir taux et plafond
   - Vérifier les grades et taux horaires

2. **Gestion des enseignants**
   - Les enseignants sont dans une base permanente
   - Ajouter uniquement les nouveaux

3. **Saisie des heures**
   - Sélectionner l'année en cours
   - Pour chaque enseignant, ajouter ses heures par faculté
   - Saisie assistée avec suggestion des enseignants existants

4. **Vérification**
   - Consulter le tableau récapitulatif
   - Vérifier les calculs automatiques

5. **Préparation des paiements**
   - Cliquer sur "Préparer paiement"
   - Saisir le pourcentage de la tranche
   - Validation avec détection automatique IRSA

6. **Génération des fiches**
   - Générer les fiches individuelles
   - Imprimer ou exporter en PDF

## Notes Importantes

- L'obligation de service de 125h (ou selon grade) n'est appliquée qu'une seule fois par année
- Un enseignant peut être exempté d'obligation s'il a des responsabilités
- Les vacataires n'ont pas d'obligation de service
- Le montant est toujours arrondi à l'entier inférieur avant calcul
- L'IRSA est configurable par année (peut être désactivé)
