## Context

La sidebar (`src/components/app-sidebar.tsx`) affiche actuellement 7 items de navigation dans un seul `SidebarGroup` labellisé "Navigation". Les primitives UI shadcn/ui incluent déjà un composant `SidebarSeparator` disponible mais non utilisé.

Les items actuels :
- Dashboard, Review Quality, Team, Team Profiles, 1:1 Prep, Sync, Settings

## Goals / Non-Goals

**Goals:**
- Séparer visuellement les items d'analyse des items de configuration dans la sidebar
- Utiliser les primitives UI existantes (pas de nouveau composant)
- Maintenir le comportement existant (active state, sync status indicator)

**Non-Goals:**
- Rendre les groupes collapsibles
- Ajouter des sous-menus ou une hiérarchie plus profonde
- Modifier le style ou le thème de la sidebar

## Decisions

### Groupement des items

Les items seront répartis en deux groupes :

| Groupe "Analyse" | Groupe "Configuration" |
|---|---|
| Dashboard | Team |
| Review Quality | Sync |
| Team Profiles | Settings |
| 1:1 Prep | |

**Rationale** : "Team Profiles" et "1:1 Prep" sont des outils d'analyse orientés manager, pas de la configuration. "Team" gère la composition de l'équipe (ajout/suppression de membres), c'est de la configuration.

### Approche technique

Remplacer le `SidebarGroup` unique par deux `SidebarGroup` séparés, avec un `SidebarSeparator` entre eux. Chaque groupe aura son propre `SidebarGroupLabel`.

**Alternative considérée** : Utiliser un seul groupe avec un `SidebarSeparator` inséré entre les items. Rejeté car les deux `SidebarGroup` distincts donnent une meilleure sémantique HTML et permettent des labels de section.

### Structure des données

Remplacer le tableau `NAV_ITEMS` unique par deux tableaux constants : `DASHBOARD_ITEMS` et `CONFIG_ITEMS`.

## Risks / Trade-offs

- [Risque] Le changement de structure casse les tests existants → Les tests seront mis à jour dans la même PR
- [Trade-off] Les labels de groupe ajoutent de la hauteur à la sidebar → Acceptable car la sidebar a peu d'items et ne scrolle pas
