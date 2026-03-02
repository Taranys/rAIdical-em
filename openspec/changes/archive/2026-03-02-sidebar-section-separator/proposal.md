## Why

La sidebar affiche actuellement tous les liens de navigation dans un seul groupe plat "Navigation". Cela rend difficile la distinction entre les pages d'analyse (Dashboard, Review Quality, 1:1 Prep) et les pages de configuration/administration (Team, Sync, Settings). Ajouter une séparation visuelle améliorera la lisibilité et l'orientation de l'utilisateur.

## What Changes

- Séparer les items de navigation en deux groupes distincts dans la sidebar :
  - **Analyse** : Dashboard, Review Quality, Team Profiles, 1:1 Prep
  - **Configuration** : Team, Sync, Settings
- Ajouter un séparateur visuel (via `SidebarSeparator` déjà disponible dans les primitives UI) entre les deux groupes
- Chaque groupe aura son propre label de section

## Capabilities

### New Capabilities
- `sidebar-nav-groups`: Séparation de la navigation de la sidebar en groupes logiques avec séparateur visuel

### Modified Capabilities

## Impact

- `src/components/app-sidebar.tsx` : Restructuration du rendu des items de navigation en deux `SidebarGroup` avec un `SidebarSeparator`
- `src/components/app-sidebar.test.tsx` : Mise à jour des tests pour vérifier la présence des deux groupes et du séparateur
- Aucun impact sur les API, la base de données ou les dépendances
