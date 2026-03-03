## Why

Les 8 catégories de classification des commentaires de review sont actuellement codées en dur dans `src/lib/llm/classifier.ts`. Chaque équipe et chaque engineering manager a des préoccupations différentes — certains veulent traquer les commentaires liés à l'accessibilité, d'autres à la documentation, d'autres encore à la dette technique. Pouvoir définir ses propres catégories (nom + description pour guider le LLM) et relancer la classification permet d'adapter l'outil à son contexte réel.

## What Changes

- Nouvelle table SQLite `custom_categories` pour stocker les catégories définies par l'utilisateur (nom, description/instruction LLM, couleur, ordre d'affichage)
- Nouvelle page `/settings/categories` avec une interface CRUD pour gérer les catégories (ajouter, modifier, supprimer, réordonner)
- API routes pour le CRUD des catégories et le déclenchement de la reclassification
- Le classifier LLM utilise les catégories custom (si elles existent) au lieu des catégories hardcodées
- Bouton "Reclassifier" sur la page des catégories pour relancer la classification de tous les commentaires avec les nouvelles catégories
- Les pages existantes (Review Quality, Team Profiles) s'adaptent dynamiquement aux catégories définies par l'utilisateur

## Capabilities

### New Capabilities
- `category-crud`: Page de gestion des catégories personnalisées — CRUD complet avec nom, description LLM, couleur et ordre d'affichage
- `dynamic-classification`: Le classifier LLM utilise les catégories custom au lieu des catégories hardcodées, avec possibilité de relancer la classification

### Modified Capabilities
_Aucune spec existante modifiée au niveau des requirements._

## Impact

- **Database**: Nouvelle table `custom_categories` + migration Drizzle
- **Backend**: `src/lib/llm/classifier.ts` (prompt dynamique), `src/lib/category-colors.ts` (config dynamique), `src/lib/seniority-dimensions.ts` (mapping dynamique)
- **Frontend**: Nouvelle page `/settings/categories`, adaptation des composants de Review Quality et Team Profiles pour lire les catégories depuis la DB
- **API**: Nouvelles routes `/api/categories` (CRUD) et `/api/categories/reclassify` (trigger)
