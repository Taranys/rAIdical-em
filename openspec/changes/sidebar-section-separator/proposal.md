## Why

La sidebar de l'application affiche tous les liens de navigation dans une liste plate unique, sans distinction visuelle entre les pages principales (Dashboard, Review Quality, Team Profiles, 1:1 Prep) et les pages de configuration (Team, Sync, Settings). Cela rend la navigation moins intuitive à mesure que le nombre d'éléments augmente.

## What Changes

- Séparer les items de navigation en deux groupes visuels distincts dans la sidebar :
  - **Section principale** : Dashboard, Review Quality, Team Profiles, 1:1 Prep
  - **Section configuration** : Team, Sync, Settings
- Ajouter un séparateur visuel (via `SidebarSeparator` ou un second `SidebarGroup` avec label) entre les deux sections
- Chaque section aura son propre label de groupe pour plus de clarté

## Capabilities

### New Capabilities
- `sidebar-grouped-navigation`: Regroupement visuel des items de la sidebar en sections distinctes (Dashboard vs Configuration) avec séparateurs et labels de groupe

### Modified Capabilities

_(aucune modification de capabilities existantes)_

## Impact

- `src/components/app-sidebar.tsx` : restructuration du composant pour utiliser plusieurs `SidebarGroup`
- `src/components/app-sidebar.test.tsx` : mise à jour des tests unitaires pour refléter la nouvelle structure
- `e2e/navigation.spec.ts` : vérification que les tests E2E restent valides avec la nouvelle structure
