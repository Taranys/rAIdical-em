## Context

La sidebar actuelle (`src/components/app-sidebar.tsx`) utilise un tableau `NAV_ITEMS` unique rendu dans un seul `SidebarGroup` labellisé "Navigation". Les 7 items (Dashboard, Review Quality, Team, Team Profiles, 1:1 Prep, Sync, Settings) sont affichés sans distinction visuelle.

Le composant shadcn/ui `sidebar.tsx` fournit déjà les primitives nécessaires : `SidebarGroup`, `SidebarGroupLabel`, et `SidebarSeparator`.

## Goals / Non-Goals

**Goals:**
- Séparer visuellement les items de navigation en deux sections : principale et configuration
- Utiliser les composants shadcn/ui existants sans créer de nouveaux composants
- Maintenir le comportement existant (active state, tooltips en mode collapsed, sync status)

**Non-Goals:**
- Ajouter des sections repliables/accordéon (pas nécessaire pour 7 items)
- Modifier le style visuel global de la sidebar
- Changer l'ordre ou le routing des pages

## Decisions

### 1. Deux `SidebarGroup` avec labels plutôt qu'un simple `SidebarSeparator`

**Choix** : Utiliser deux `SidebarGroup` distincts, chacun avec son propre `SidebarGroupLabel`.

**Rationale** : Un simple séparateur (ligne horizontale) ne donne pas assez de contexte. Les labels de groupe ("Dashboard" et "Configuration") communiquent clairement le rôle de chaque section. Le composant `SidebarGroup` est déjà disponible et gère le spacing automatiquement.

**Alternative rejetée** : Un `SidebarSeparator` seul entre les deux — moins informatif, pas d'accessibilité sémantique.

### 2. Découpage des items en deux constantes

**Choix** : Remplacer `NAV_ITEMS` par `MAIN_NAV_ITEMS` et `CONFIG_NAV_ITEMS`.

**Rationale** : Plus lisible, plus facile à maintenir. Chaque tableau correspond à une section de la sidebar. Facilite l'ajout de nouveaux items dans la bonne catégorie.

### 3. Classification des items

**Choix** :
- **Section principale** : Dashboard, Review Quality, Team Profiles, 1:1 Prep (pages d'analyse et suivi)
- **Section configuration** : Team, Sync, Settings (pages de paramétrage)

**Rationale** : Les pages principales sont celles qu'un EM consulte au quotidien. Les pages de configuration sont utilisées moins fréquemment pour paramétrer l'outil.

## Risks / Trade-offs

- **[Faible] Tests E2E cassés** → Les tests naviguent par texte de lien, pas par structure DOM. La restructuration ne devrait pas les impacter, mais il faut vérifier.
- **[Faible] Mode collapsed** → En mode icônes, les labels de groupe disparaissent automatiquement (comportement natif shadcn/ui). Le rendu restera cohérent.
