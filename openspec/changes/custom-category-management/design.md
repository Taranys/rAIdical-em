## Context

Les catégories de classification sont actuellement définies en dur dans `src/lib/llm/classifier.ts` (type `CommentCategory` + tableau `COMMENT_CATEGORIES` + descriptions dans le prompt). Elles sont consommées par :
- `category-colors.ts` — couleurs et labels pour l'affichage
- `seniority-dimensions.ts` — mapping catégories → dimensions techniques
- Le prompt LLM dans `buildClassificationPrompt()` — descriptions textuelles
- Les pages Review Quality et Team Profiles — filtres, charts, radar

L'utilisateur veut pouvoir définir ses propres catégories avec un nom et une description (instruction pour le LLM), puis relancer la classification.

## Goals / Non-Goals

**Goals:**
- Permettre à l'utilisateur de définir ses propres catégories via une page dédiée
- Chaque catégorie a un nom (slug), un label d'affichage, une description/instruction pour le LLM, et une couleur
- Le classifier LLM utilise dynamiquement les catégories custom quand elles existent
- L'utilisateur peut relancer la classification de tous les commentaires avec ses nouvelles catégories
- Les pages existantes s'adaptent automatiquement aux catégories définies

**Non-Goals:**
- Gestion de plusieurs jeux de catégories (presets) — un seul jeu actif à la fois
- Historique des versions de catégories
- Migration automatique des anciennes classifications vers les nouvelles catégories
- Catégories par membre d'équipe — les catégories sont globales

## Decisions

### 1. Stockage en SQLite avec table `custom_categories`

**Choix:** Nouvelle table Drizzle `custom_categories` avec les champs : `id`, `slug` (unique, snake_case), `label`, `description`, `color` (hex), `sortOrder`, `createdAt`, `updatedAt`.

**Rationale:** Cohérent avec le pattern existant (SQLite + Drizzle). Le slug sert d'identifiant stable pour les `comment_classifications.category`. Le `sortOrder` permet à l'utilisateur de contrôler l'ordre d'affichage.

**Alternative écartée:** Stocker dans la table `settings` en JSON — moins flexible pour les requêtes et les index.

### 2. Fallback sur les catégories par défaut

**Choix:** Si la table `custom_categories` est vide, le système utilise les 8 catégories hardcodées actuelles comme fallback. Au premier lancement de la page, on propose de "seed" avec les catégories par défaut.

**Rationale:** Pas de breaking change pour les utilisateurs existants. Le seeding facilite la personnalisation progressive.

### 3. Reclassification en batch

**Choix:** Réutiliser le mécanisme existant de `classification_runs` + `classification-service.ts`. Le bouton "Reclassifier" crée un nouveau `classification_run`, supprime les classifications existantes (non manuelles), et relance le batch.

**Rationale:** Infrastructure déjà en place. Les classifications manuelles (`isManual=1`) sont préservées.

### 4. Prompt LLM dynamique

**Choix:** `buildClassificationPrompt()` accepte un paramètre optionnel `categories: CustomCategory[]`. Si fourni, il construit la section catégories du prompt à partir de ces données au lieu du texte hardcodé.

**Rationale:** Changement minimal dans le classifier. Le format du prompt reste identique, seul le contenu des catégories change.

### 5. Couleurs dynamiques

**Choix:** `CATEGORY_CONFIG` devient une fonction `getCategoryConfig()` qui lit la DB si des catégories custom existent, sinon retourne le config hardcodé. Côté client, les couleurs sont servies par l'API avec les catégories.

**Rationale:** Les composants existants (donut chart, bar chart, filtres) continuent de fonctionner sans modification de leur interface — ils reçoivent juste un config différent.

### 6. Page dans Settings

**Choix:** Route `/settings/categories` avec un formulaire inline (pas de modal). Liste des catégories avec drag-and-drop pour réordonner, boutons edit/delete, et formulaire d'ajout en bas.

**Rationale:** Pattern cohérent avec une page de configuration. Le drag-and-drop rend le réordonnancement intuitif.

## Risks / Trade-offs

- **[Reclassification longue]** → La reclassification de tous les commentaires peut être lente (appels LLM). Mitigation : réutiliser le mécanisme fire-and-forget existant avec feedback de progression.
- **[Catégories supprimées]** → Si l'utilisateur supprime une catégorie qui a des classifications, les données historiques deviennent orphelines. Mitigation : soft-delete ou warning avant suppression avec nombre de commentaires affectés.
- **[Mapping seniority cassé]** → Les dimensions techniques de séniorité sont mappées aux catégories hardcodées. Mitigation : pour la V1, le mapping séniorité reste sur les catégories par défaut. L'adaptation du mapping séniorité est un chantier séparé.
