## 1. Restructuration des données de navigation

- [ ] 1.1 Séparer `NAV_ITEMS` en deux constantes `DASHBOARD_ITEMS` et `CONFIG_ITEMS` dans `app-sidebar.tsx`

## 2. Mise à jour du rendu de la sidebar

- [ ] 2.1 Importer `SidebarSeparator` depuis les primitives UI
- [ ] 2.2 Remplacer le `SidebarGroup` unique par deux `SidebarGroup` (labels "Analyse" et "Configuration") avec un `SidebarSeparator` entre eux
- [ ] 2.3 Vérifier que le `SyncStatusIndicator` fonctionne toujours sur l'item "Sync" dans le groupe Configuration

## 3. Tests

- [ ] 3.1 Mettre à jour les tests existants dans `app-sidebar.test.tsx` pour vérifier la présence des deux groupes et du séparateur
- [ ] 3.2 Ajouter un test vérifiant que les items sont dans le bon groupe
