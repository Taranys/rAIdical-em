## Why

Le menu de configuration manque de guidage visuel. L'utilisateur ne sait pas d'un coup d'œil quels éléments sont déjà configurés et lesquels nécessitent encore une action. De plus, "Settings" (qui contient les tokens GitHub et le repo — prérequis à tout le reste) est en dernière position dans le groupe Configuration, alors qu'il devrait être le premier pas logique.

## What Changes

- **Réordonner le groupe Configuration** : placer "Settings" en première position, suivi de "Team" puis "Sync"
- **Ajouter des indicateurs de statut sur chaque item du groupe Configuration** :
  - **Settings** : icône ✅ si GitHub PAT **et** GitHub Repository sont configurés ; icône d'avertissement sinon
  - **Team** : icône ✅ si au moins un membre d'équipe est défini ; icône d'avertissement sinon
  - **Sync** : conserver le comportement actuel (emoji running/success/error) et ajouter une icône d'avertissement si aucun sync n'a jamais été lancé
- **Créer une API endpoint** `/api/sidebar-status` qui retourne l'état de configuration de chaque section en un seul appel

## Capabilities

### New Capabilities
- `sidebar-config-status`: Indicateurs de statut visuels sur les items du groupe Configuration dans le sidebar, indiquant si chaque section nécessite une action ou est correctement configurée

### Modified Capabilities
- `sidebar-nav-groups`: L'ordre des items dans le groupe "Configuration" change (Settings, Team, Sync au lieu de Team, Sync, Settings)

## Impact

- `src/components/app-sidebar.tsx` — Réordonnement des items + ajout des indicateurs de statut
- `src/components/app-sidebar.test.tsx` — Mise à jour des tests pour le nouvel ordre et les indicateurs
- `src/app/api/sidebar-status/route.ts` — Nouveau endpoint API agrégé
- `openspec/specs/sidebar-nav-groups/spec.md` — Mise à jour de l'ordre des items
