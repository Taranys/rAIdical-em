## Why

Le Period Selector est actuellement instancié indépendamment dans chaque page (Dashboard et 1:1 Preparation) via un `PeriodProvider` local. Quand l'utilisateur change la période sur le Dashboard puis navigue vers la page 1:1, la sélection revient au défaut ("this-month"). Cela force à re-sélectionner la période à chaque changement de page, ce qui est frustrant et casse le workflow de consultation croisée des métriques.

## What Changes

- Remonter le `PeriodProvider` au niveau du root layout pour que la période sélectionnée persiste lors de la navigation entre pages
- Déplacer le composant `PeriodSelector` dans le header global de l'application (à côté du `SidebarTrigger`)
- Supprimer les `PeriodProvider` et `PeriodSelector` locaux des pages Dashboard et 1:1 Preparation
- Adapter la page Review Quality (qui utilise un sélecteur de mois local) et la page Sync (qui utilise un sélecteur de trimestre local) pour consommer le contexte global si pertinent

## Capabilities

### New Capabilities
- `global-period-context`: Remonter le PeriodProvider au root layout et afficher le PeriodSelector dans le header global, partagé entre toutes les pages

### Modified Capabilities

## Impact

- `src/app/layout.tsx` — ajout du PeriodProvider et du PeriodSelector dans le header
- `src/app/dashboard-context.tsx` — suppression ou refactoring du PeriodProvider local
- `src/app/dashboard-content.tsx` — suppression du PeriodProvider et PeriodSelector locaux
- `src/app/one-on-one/one-on-one-content.tsx` — suppression du PeriodProvider et PeriodSelector locaux
- `src/app/period-selector.tsx` — potentiel déplacement ou adaptation du composant
- Tests existants à adapter pour le nouveau contexte global
