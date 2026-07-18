# HC-Manager — Gestion des heures complémentaires

## Objet et état actuel

HC-Manager est une application web de gestion des heures complémentaires des enseignants du supérieur à Madagascar. Elle est développée avec **Next.js App Router**, TypeScript et Tailwind CSS.

> **Persistance active :** l'application fonctionne actuellement en mode **JSON-only**. Les données sont versionnées dans `data/*.json` et sont lues/écrites par `src/db/jsonStore.ts`. Le fichier `src/db/schema.ts` documente le schéma PostgreSQL/Drizzle cible, mais PostgreSQL n'est pas requis à l'exécution.

---

## Architecture des données

### Fichiers de données actifs

| Collection | Fichier | Rôle |
|---|---|---|
| Années universitaires | `data/annees.json` | Année, tranche, IRSA, plafond et formule HC |
| Grades | `data/grades.json` | Codes, libellés et taux horaires |
| Établissements | `data/etablissements.json` | Premier niveau de la structure académique |
| Domaines | `data/domaines.json` | Domaines rattachés à un établissement |
| Mentions | `data/mentions.json` | Mentions rattachées à un domaine |
| Parcours | `data/parcours.json` | Parcours rattachés à une mention ; feuille de sélection des HC |
| Enseignants | `data/enseignants.json` | Informations personnelles et permanentes |
| Heures | `data/heures.json` | Heures, grade, statut et obligation historiques |
| Paiements | `data/paiements.json` | Avances et versements par tranche |

### Hiérarchie académique séparée

La structure académique n'est **plus** enregistrée dans une unique table `facultes` qui répétait les quatre libellés. Elle est normalisée ainsi :

```text
Établissement 1 ──< Domaine ──< Mention ──< Parcours
```

Les trois premiers libellés sont obligatoires. Le parcours est facultatif : lorsqu'une mention n'a pas de parcours nommé, une feuille `parcours` avec une valeur `null` est créée afin que chaque ligne d'heures puisse tout de même référencer une structure précise.

#### 1. `etablissements`

```sql
- id: serial PRIMARY KEY
- etablissement: varchar(200) NOT NULL UNIQUE
```

#### 2. `domaines`

```sql
- id: serial PRIMARY KEY
- etablissementId: integer NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE
- domaine: varchar(200) NOT NULL
- UNIQUE(etablissementId, domaine)
```

#### 3. `mentions`

```sql
- id: serial PRIMARY KEY
- domaineId: integer NOT NULL REFERENCES domaines(id) ON DELETE CASCADE
- mention: varchar(200) NOT NULL
- UNIQUE(domaineId, mention)
```

#### 4. `parcours`

```sql
- id: serial PRIMARY KEY
- mentionId: integer NOT NULL REFERENCES mentions(id) ON DELETE CASCADE
- parcours: varchar(200)                 -- facultatif
- code: varchar(20)                      -- facultatif, conservé pour les codes internes
- UNIQUE(mentionId, parcours)
```

**Règles de la structure :**

- `etablissement`, `domaine` et `mention` sont obligatoires et limités à 200 caractères.
- Un domaine n'existe que pour un établissement donné ; une mention n'existe que pour un domaine donné.
- Un parcours est la feuille de la hiérarchie et est l'élément référencé dans les heures.
- Les doublons sont contrôlés sans tenir compte de la casse.
- L'ancien fichier `data/facultes.json` est migré automatiquement, si présent dans une installation existante, sans changer les identifiants des parcours. Cela préserve les liens des heures existantes.
- La suppression d'un parcours utilisé dans des heures est refusée pour éviter une donnée orpheline.

### Tables métier

#### 5. `annees` — Années universitaires

```sql
- id: serial PRIMARY KEY
- libelle: varchar(50) UNIQUE            -- ex. « 2025-2026 »
- tranche: varchar(100)                  -- ex. « Première tranche »
- active: boolean
- appliquerIRSA: boolean
- tauxIRSA: real                          -- pourcentage, défaut 20
- plafondPaiement: numeric                -- optionnel
- formuleHC: varchar                      -- optionnelle ; formule par année
```

#### 6. `grades` — Grades et taux horaires

```sql
- id: serial PRIMARY KEY
- code: varchar(10) UNIQUE                -- A, MC, PR, PRT
- libelle: varchar(100) NOT NULL
- tauxHoraire: integer NOT NULL           -- Ariary
```

| Code | Libellé | Taux par défaut |
|---|---|---:|
| A | Assistant | 6 000 Ar |
| MC | Maître de Conférences | 8 000 Ar |
| PR | Professeur | 10 000 Ar |
| PRT | Professeur Titulaire | 12 000 Ar |

#### 7. `enseignants` — Informations permanentes

```sql
- id: serial PRIMARY KEY
- nom: varchar(150) NOT NULL              -- MAJUSCULES automatiques
- prenom: varchar(200)                    -- Title Case, optionnel
- cin: varchar(50)
- dateCIN: date
- dateNaissance: date
- lieuNaissance: varchar(200)
- nationalite: varchar(100) DEFAULT 'Malagasy'
- adresse: text                           -- Title Case
- telephone: varchar(20)                  -- 000 00 000 00
- email: varchar(200)
- rib: varchar(30)                        -- 00005 00001 12094250100 09
- specialite: varchar(200)
- etablissementPrincipal: varchar(200)
- dateRecrutement: date
```

> Le **grade** et le **statut** ne sont pas stockés dans la fiche permanente de l'enseignant. Ils sont saisis avec chaque ligne d'heures, afin de préserver l'historique.

#### 8. `heures` — Heures par enseignant et année

```sql
- id: serial PRIMARY KEY
- enseignantId: integer NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE
- anneeId: integer NOT NULL REFERENCES annees(id) ON DELETE CASCADE
- parcoursId: integer REFERENCES parcours(id)
- gradeId: integer REFERENCES grades(id)
- statut: varchar(20) NOT NULL            -- Permanent | Vacataire
- heuresET: real DEFAULT 0
- heuresED: real DEFAULT 0
- heuresEP: real DEFAULT 0
- heuresSoutenance: real DEFAULT 0
- heuresRecherche: real DEFAULT 0
- obligation: real DEFAULT 125
```

- `parcoursId` remplace l'ancien `faculteId`.
- Une ligne d'heures doit cibler un parcours/une structure existante, un grade et un statut.
- Le grade, le statut et l'obligation sont les valeurs **au moment de la saisie**.
- L'obligation par défaut est de 125 h pour un permanent et de 0 h pour un vacataire.

#### 9. `paiements` — Avances et paiements par tranches

```sql
- id: serial PRIMARY KEY
- enseignantId: integer NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE
- anneeId: integer NOT NULL REFERENCES annees(id) ON DELETE CASCADE
- montantAvance: real DEFAULT 0
- dateAvance: date
- pourcentageTranche: real
- montantPaye: real DEFAULT 0
- datePaiement: date
- reference: varchar(100)
- statut: varchar(30) DEFAULT 'En attente'
```

---

## Règles métier

### Calcul des heures complémentaires

```text
HC Brut = formuleHC de l'année
          (formule par défaut : ET + ED + EP + Soutenance + Recherche)

Si statut = « Permanent » et obligation > 0 :
    HC Nette = max(0, HC Brut - obligation)
Sinon :
    HC Nette = HC Brut

HC Arrondie = floor(HC Nette)
Montant Brut = HC Arrondie × taux horaire du grade historique

Si un plafond est défini et Montant Brut > plafond :
    Montant Brut = plafond

IRSA = Montant Brut × tauxIRSA / 100, seulement si appliquerIRSA = true
Montant Net = Montant Brut - IRSA
Reste à payer = Montant Net - avances - montants déjà versés
```

### Historique indispensable

Un enseignant peut changer de grade ou de statut d'une année à l'autre. Les valeurs sont donc sauvegardées dans `heures`, et non dans `enseignants`. Les calculs d'anciennes années restent ainsi exacts.

---

## Interface utilisateur

### En-tête et tableau principal

- Sélecteur d'année : la dernière année est sélectionnée au lancement.
- Badge de tranche et indicateur IRSA (appliqué ou non).
- Recherche par nom, prénom, CIN ou établissement ; filtres de statut et de grade.
- Le tableau regroupe les heures par enseignant et affiche le grade/statut historiques, l'établissement, les volumes ET/ED/EP/soutenance/recherche, HC, obligation, IRSA et montants.

### Bouton « Structures »

Le bouton **🏛️ Structures** ouvre la gestion de la hiérarchie académique.

- Les champs proposés sont **Établissement***, **Domaine***, **Mention***, **Parcours** et **Code**.
- La saisie assistée cherche dans les quatre bases séparées.
- L'enregistrement crée, si nécessaire, les parents de la hiérarchie et le parcours feuille.
- La liste affichée est une vue aplatie de `Établissement → Domaine → Mention → Parcours` : elle ne correspond pas à une table de persistance unique.
- La modification et la suppression sont disponibles ; une structure utilisée par des heures ne peut pas être supprimée.

### Bouton « Saisir Heures »

1. Rechercher un enseignant ou créer sa fiche permanente.
2. Saisir les informations historiques de la ligne HC :
   - grade obligatoire ;
   - statut obligatoire ;
   - parcours/structure académique obligatoire ;
   - ET, ED, EP, soutenance, recherche et obligation.

Les sélecteurs affichent la hiérarchie complète, mais la valeur enregistrée est le `parcoursId` de la feuille sélectionnée.

### Bouton « Enseignants »

- Liste indépendante de l'année, pour l'ensemble de la base des enseignants.
- Modification des informations permanentes : identité, CIN, coordonnées, RIB, spécialité et établissement principal.
- Le formulaire n'affiche ni grade ni statut.

### Paiements et fiches

- Paiement individuel ou par tranche avec calcul de la part, des avances et du reste à payer.
- Fiche individuelle avec détails par structure (établissement, domaine, mention, parcours), calculs et montant en lettres.
- Exports base, fiche et Excel utilisent la hiérarchie normalisée via la vue de parcours.

---

## Normalisation et masques

| Champ | Règle |
|---|---|
| Nom | MAJUSCULES automatiques |
| Prénom et adresse | Title Case automatique |
| Téléphone | Masque `000 00 000 00` |
| RIB | Masque `00005 00001 12094250100 09` |
| Établissement, domaine, mention, parcours | Libellés réutilisables, contrôle de doublons insensible à la casse |

---

## API

| Route | Méthodes | Description |
|---|---|---|
| `/api/seed` | POST | Initialise les données de référence si elles sont absentes |
| `/api/annees` | GET, POST, PUT | Années, IRSA, plafond et formule HC |
| `/api/grades` | GET, POST, PUT | Grades et taux horaires |
| `/api/structures` | GET, POST, PUT, DELETE | Structure académique normalisée ; `?view=hierarchy` renvoie les quatre bases et `?level=` permet de les consulter séparément |
| `/api/facultes` | GET, POST, PUT, DELETE | Alias historique compatible de `/api/structures` |
| `/api/enseignants` | GET, POST | Liste globale ou agrégée par année, création |
| `/api/enseignants/[id]` | GET, PUT, DELETE | Consultation, modification et suppression en cascade |
| `/api/heures` | GET, POST | Lignes HC avec `parcoursId`, grade et statut historiques |
| `/api/heures/[id]` | GET, PUT, DELETE | Modification ou suppression d'une ligne HC |
| `/api/paiements` | GET, POST | Paiements et avances |
| `/api/export/base` | GET | Base agrégée par année |
| `/api/export/excel` | GET | Export Excel |
| `/api/export/fiche` | GET | Fiche individuelle par année |

---

## Compatibilité et migration

- Les données actuelles de structure sont distribuées dans `etablissements.json`, `domaines.json`, `mentions.json` et `parcours.json`.
- Les identifiants de parcours ont été conservés lors de la séparation ; les heures existantes ont été converties de `faculteId` vers `parcoursId`.
- Une installation possédant encore `data/facultes.json` est automatiquement convertie lors du premier accès à la structure académique.
- `/api/facultes` est gardée comme route historique pour les clients existants, tandis que l'application utilise `/api/structures`.

---

## Validation attendue

```bash
npm run typecheck
npm run build
```

Les deux commandes doivent réussir. La vérification manuelle essentielle consiste à consulter `/api/structures?view=hierarchy`, à créer une structure, puis à l'utiliser dans une ligne d'heures : la ligne doit enregistrer un `parcoursId` et restituer correctement établissement, domaine, mention et parcours.
