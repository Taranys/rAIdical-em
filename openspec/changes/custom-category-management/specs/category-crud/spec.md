## ADDED Requirements

### Requirement: Custom categories database table
Le système DOIT stocker les catégories personnalisées dans une table `custom_categories` avec les champs : `id` (PK auto-increment), `slug` (text unique, snake_case), `label` (text), `description` (text — instruction pour le LLM), `color` (text, hex), `sortOrder` (integer), `createdAt` (text ISO), `updatedAt` (text ISO).

#### Scenario: Table vide au démarrage
- **WHEN** l'application démarre sans catégories custom
- **THEN** la table `custom_categories` est vide et le système utilise les catégories par défaut hardcodées

#### Scenario: Seed avec les catégories par défaut
- **WHEN** l'utilisateur accède à la page des catégories et qu'aucune catégorie custom n'existe
- **THEN** le système propose de pré-remplir avec les 8 catégories par défaut

### Requirement: API CRUD pour les catégories
Le système DOIT exposer des routes API pour gérer les catégories personnalisées :
- `GET /api/categories` — liste toutes les catégories (custom si elles existent, sinon default)
- `POST /api/categories` — créer une nouvelle catégorie
- `PUT /api/categories/:id` — modifier une catégorie existante
- `DELETE /api/categories/:id` — supprimer une catégorie

#### Scenario: Lister les catégories (aucune custom)
- **WHEN** un appel GET est fait à `/api/categories` et qu'aucune catégorie custom n'existe
- **THEN** le système retourne les 8 catégories par défaut avec un flag `isDefault: true`

#### Scenario: Lister les catégories (custom existantes)
- **WHEN** un appel GET est fait à `/api/categories` et que des catégories custom existent
- **THEN** le système retourne uniquement les catégories custom triées par `sortOrder`

#### Scenario: Créer une catégorie
- **WHEN** un appel POST est fait avec `{ slug, label, description, color }`
- **THEN** la catégorie est créée avec un `sortOrder` auto-incrémenté et le système retourne la catégorie créée

#### Scenario: Créer une catégorie avec slug dupliqué
- **WHEN** un appel POST est fait avec un `slug` déjà existant
- **THEN** le système retourne une erreur 409 Conflict

#### Scenario: Modifier une catégorie
- **WHEN** un appel PUT est fait à `/api/categories/:id` avec des champs mis à jour
- **THEN** la catégorie est mise à jour et le système retourne la catégorie modifiée

#### Scenario: Supprimer une catégorie
- **WHEN** un appel DELETE est fait à `/api/categories/:id`
- **THEN** la catégorie est supprimée de la table

#### Scenario: Réordonner les catégories
- **WHEN** un appel PUT est fait à `/api/categories/reorder` avec un tableau d'IDs dans le nouvel ordre
- **THEN** les `sortOrder` de toutes les catégories sont mis à jour selon l'ordre fourni

### Requirement: Page de gestion des catégories
Le système DOIT fournir une page `/settings/categories` permettant de gérer les catégories.

#### Scenario: Affichage de la liste des catégories
- **WHEN** l'utilisateur accède à `/settings/categories`
- **THEN** la page affiche la liste des catégories avec pour chaque : pastille de couleur, label, slug, et description (tronquée)

#### Scenario: Ajout d'une nouvelle catégorie
- **WHEN** l'utilisateur clique sur "Ajouter une catégorie" et remplit le formulaire (label, slug auto-généré, description, couleur)
- **THEN** la catégorie est créée via l'API et apparaît dans la liste

#### Scenario: Modification d'une catégorie
- **WHEN** l'utilisateur clique sur le bouton d'édition d'une catégorie
- **THEN** un formulaire inline s'affiche avec les valeurs actuelles, modifiables et enregistrables

#### Scenario: Suppression d'une catégorie avec avertissement
- **WHEN** l'utilisateur clique sur le bouton de suppression d'une catégorie qui a des classifications associées
- **THEN** un dialogue de confirmation s'affiche indiquant le nombre de commentaires classifiés dans cette catégorie

#### Scenario: Réordonnancement par drag-and-drop
- **WHEN** l'utilisateur réordonne les catégories par drag-and-drop
- **THEN** les positions sont mises à jour via l'API et l'ordre est reflété partout dans l'application

### Requirement: Initialisation depuis les catégories par défaut
Le système DOIT permettre de pré-remplir les catégories custom depuis les catégories par défaut.

#### Scenario: Bouton seed
- **WHEN** la table `custom_categories` est vide et que l'utilisateur clique sur "Initialiser avec les catégories par défaut"
- **THEN** les 8 catégories par défaut sont insérées dans la table avec leurs descriptions et couleurs existantes
