## 1. Extraction du header global

- [x] 1.1 Créer le composant `AppHeader` ("use client") dans `src/components/app-header.tsx` contenant le `SidebarTrigger` et le `PeriodSelector`, avec `print:hidden` sur le header
- [x] 1.2 Mettre à jour `src/app/layout.tsx` pour utiliser `AppHeader` à la place du header inline actuel

## 2. Remonter le PeriodProvider au root layout

- [x] 2.1 Créer un composant wrapper client `AppProviders` dans `src/components/app-providers.tsx` qui encapsule `PeriodProvider` (et potentiellement d'autres providers globaux) autour des children
- [x] 2.2 Mettre à jour `src/app/layout.tsx` pour wrapper le contenu avec `AppProviders`

## 3. Supprimer les providers et sélecteurs locaux

- [x] 3.1 Retirer le `PeriodProvider` et le `PeriodSelector` de `src/app/dashboard-content.tsx` — les cartes métriques consommeront le contexte global
- [x] 3.2 Retirer le `PeriodProvider` et le `PeriodSelector` de `src/app/one-on-one/one-on-one-content.tsx` — le composant `OneOnOneInner` consommera le contexte global

## 4. Tests et validation

- [x] 4.1 Mettre à jour les tests existants du Dashboard et de la page 1:1 pour refléter le provider global (wrapping test avec `PeriodProvider` au bon niveau)
- [ ] 4.2 Vérifier que le build passe (`npm run build`) et que le lint est propre (`npm run lint`)
- [ ] 4.3 Vérifier le comportement print de la page 1:1 (le `period.label` reste visible dans le contenu imprimé)
