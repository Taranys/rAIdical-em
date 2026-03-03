## 1. Database & Schema

- [ ] 1.1 Ajouter la table `custom_categories` dans `src/db/schema.ts` (id, slug, label, description, color, sortOrder, createdAt, updatedAt)
- [ ] 1.2 Générer la migration Drizzle (`npm run db:generate`) et l'appliquer (`npm run db:migrate`)
- [ ] 1.3 Créer le fichier DAL `src/db/custom-categories.ts` avec les opérations CRUD (getAll, create, update, delete, reorder, count par catégorie) et la logique d'auto-seed des 8 catégories par défaut quand la table est vide

## 2. API Routes

- [ ] 2.1 Créer `src/app/api/categories/route.ts` — GET (liste catégories custom ou default) et POST (créer catégorie)
- [ ] 2.2 Créer `src/app/api/categories/[id]/route.ts` — PUT (modifier) et DELETE (supprimer)
- [ ] 2.3 Créer `src/app/api/categories/reorder/route.ts` — PUT (réordonner les catégories)
- [ ] 2.4 Créer `src/app/api/categories/reset/route.ts` — POST (réinitialiser les catégories par défaut)
- [ ] 2.5 Créer `src/app/api/categories/reclassify/route.ts` — POST (déclencher la reclassification batch)

## 3. Classification dynamique

- [ ] 3.1 Modifier `buildClassificationPrompt()` dans `src/lib/llm/classifier.ts` pour accepter un paramètre optionnel `categories` et construire le prompt dynamiquement
- [ ] 3.2 Modifier `classification-service.ts` pour lire les catégories custom depuis la DB avant de lancer la classification
- [ ] 3.3 Adapter `parseClassificationResponse()` pour valider les catégories dynamiquement (pas seulement les 8 hardcodées)
- [ ] 3.4 Implémenter la logique de reclassification : suppression des classifications non-manuelles + relance batch

## 4. Configuration couleurs dynamique

- [ ] 4.1 Créer une fonction `getCategoryConfig()` dans `src/lib/category-colors.ts` qui retourne le config depuis la DB ou le fallback hardcodé
- [ ] 4.2 Adapter l'API `/api/review-quality/charts` pour utiliser les couleurs dynamiques
- [ ] 4.3 Adapter les composants de filtres Review Quality pour charger les catégories dynamiquement

## 5. Page Settings / Categories

- [ ] 5.1 Créer la page `/settings/categories` avec layout (`src/app/settings/categories/page.tsx`)
- [ ] 5.2 Créer le composant liste des catégories avec pastille couleur, label, slug et description
- [ ] 5.3 Créer le formulaire d'ajout/édition de catégorie (label, slug auto-généré, description textarea, color picker)
- [ ] 5.4 Implémenter le drag-and-drop pour réordonner les catégories
- [ ] 5.5 Ajouter le bouton "Réinitialiser les catégories par défaut" avec dialogue de confirmation
- [ ] 5.6 Ajouter le bouton "Reclassifier tous les commentaires" avec dialogue de confirmation et barre de progression
- [ ] 5.7 Ajouter la suppression avec dialogue de confirmation affichant le nombre de commentaires impactés

## 6. Navigation

- [ ] 6.1 Ajouter l'entrée "Categories" dans la sidebar/navigation sous la section Settings

## 7. Tests

- [ ] 7.1 Tests unitaires du DAL `custom-categories.ts` (CRUD, reorder, auto-seed)
- [ ] 7.2 Tests unitaires de `buildClassificationPrompt()` avec catégories custom
- [ ] 7.3 Tests unitaires de `parseClassificationResponse()` avec catégories dynamiques
- [ ] 7.4 Tests d'intégration des API routes categories (GET avec auto-seed, POST, PUT, DELETE, reorder, reset)
- [ ] 7.5 Test E2E : parcours complet création de catégories + reclassification
