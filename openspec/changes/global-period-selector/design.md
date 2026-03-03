## Context

Le `PeriodProvider` (React Context + useState) est actuellement instancié indépendamment dans `DashboardContent` et `OneOnOneContent`. Chaque page a sa propre instance avec un état par défaut "this-month". Quand l'utilisateur change la période sur une page puis navigue, la sélection est perdue.

Le root layout (`src/app/layout.tsx`) fournit déjà un shell global avec `SidebarProvider`, `AppSidebar`, et un header contenant le `SidebarTrigger`. C'est le point d'ancrage naturel pour un contexte global.

## Goals / Non-Goals

**Goals:**
- La période sélectionnée persiste lors de la navigation entre pages
- Le PeriodSelector est accessible depuis toutes les pages dans le header global
- Les pages existantes (Dashboard, 1:1) continuent de fonctionner avec le contexte global sans régression

**Non-Goals:**
- Persister la période sélectionnée au-delà d'un refresh (localStorage, URL params) — pas dans cette itération
- Unifier le sélecteur de trimestre de la page Sync ou le sélecteur de mois de Review Quality avec le PeriodSelector — ces pages ont des besoins spécifiques
- Ajouter de nouveaux presets de période

## Decisions

### 1. Remonter le PeriodProvider dans le root layout

**Choix :** Wrapper les `children` du root layout avec le `PeriodProvider`, en le plaçant à l'intérieur du `SidebarProvider` existant.

**Rationale :** C'est l'approche la plus simple. Le provider est déjà un composant React Context standard sans effets de bord. Le remonter dans l'arbre ne change pas son API — `usePeriod()` fonctionnera identiquement depuis n'importe quelle page.

**Alternative considérée :** Créer un layout intermédiaire (`(dashboard)/layout.tsx`) pour ne wraper que les pages qui utilisent la période. Rejeté car cela complexifie la structure sans bénéfice : le provider est léger et les pages qui n'utilisent pas `usePeriod()` ne sont pas impactées.

### 2. Déplacer le PeriodSelector dans le header global

**Choix :** Ajouter le `PeriodSelector` dans le `<header>` du root layout, à côté du `SidebarTrigger`, aligné à droite avec un `ml-auto`.

**Rationale :** Le header est déjà présent sur toutes les pages. Placer le sélecteur ici le rend accessible partout sans duplication. Le layout existant (flex, h-12) peut accueillir le composant sans modification structurelle majeure.

**Alternative considérée :** Placer le sélecteur dans la sidebar. Rejeté car la sidebar peut être fermée et le sélecteur doit toujours être visible.

### 3. Extraire le header dans un composant client dédié

**Choix :** Créer un composant `AppHeader` ("use client") qui contient le `SidebarTrigger` et le `PeriodSelector`. Le root layout (Server Component) importera ce composant.

**Rationale :** Le root layout est un Server Component. Le `PeriodSelector` a besoin de `usePeriod()` (client-side). Extraire le header dans un composant client permet de garder le layout comme Server Component tout en utilisant le contexte.

### 4. Supprimer les PeriodProvider et PeriodSelector locaux

**Choix :** Retirer le `PeriodProvider` wrapper de `DashboardContent` et `OneOnOneContent`, et supprimer le `PeriodSelector` de leurs en-têtes de page. Les composants continueront d'appeler `usePeriod()` normalement car le provider est maintenant au-dessus dans l'arbre.

**Rationale :** Évite les double-providers (qui créeraient des contextes isolés) et la duplication du sélecteur.

## Risks / Trade-offs

- **[Le header est un Server Component]** → Mitigation : extraction d'un composant `AppHeader` client. Impact minimal car le header ne fait pas de server-side fetching.
- **[Pages sans besoin de période voient le sélecteur]** → Trade-off acceptable. Les pages Team, Settings, Team Profiles ne l'utilisent pas mais le sélecteur reste discret dans le header. Si besoin futur, on pourra le masquer conditionnellement par route.
- **[Print layout de la page 1:1]** → La page 1:1 utilise `print:hidden` sur le PeriodSelector local. Avec le sélecteur dans le header global, le header entier a vocation à être masqué en impression (`print:hidden` sur le header). Vérifier que le `period.label` en mode print fonctionne toujours.
