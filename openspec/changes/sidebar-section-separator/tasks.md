## 1. Restructuration du composant sidebar

- [ ] 1.1 Séparer `NAV_ITEMS` en deux constantes `MAIN_NAV_ITEMS` (Dashboard, Review Quality, Team Profiles, 1:1 Prep) et `CONFIG_NAV_ITEMS` (Team, Sync, Settings)
- [ ] 1.2 Remplacer le `SidebarGroup` unique par deux `SidebarGroup` distincts avec leurs `SidebarGroupLabel` respectifs ("Dashboard" et "Configuration")
- [ ] 1.3 Vérifier le rendu en mode expanded (labels visibles, items correctement groupés)
- [ ] 1.4 Vérifier le rendu en mode collapsed/icon-only (labels masqués, tooltips fonctionnels)

## 2. Tests

- [ ] 2.1 Mettre à jour les tests unitaires dans `app-sidebar.test.tsx` pour vérifier la présence des deux labels de groupe
- [ ] 2.2 Ajouter un test vérifiant que les items sont dans le bon groupe
- [ ] 2.3 Vérifier que les tests E2E existants dans `e2e/navigation.spec.ts` passent toujours sans modification
