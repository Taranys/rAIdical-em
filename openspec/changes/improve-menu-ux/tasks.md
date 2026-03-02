## 1. API Endpoint

- [ ] 1.1 Créer `src/app/api/sidebar-status/route.ts` avec le handler GET qui retourne le statut de configuration (settings, team, sync)
- [ ] 1.2 Écrire les tests unitaires pour le endpoint `/api/sidebar-status` (tous configurés, rien configuré, partiellement configuré)

## 2. Hook Client

- [ ] 2.1 Créer `src/hooks/use-sidebar-status.ts` — hook qui fetch `/api/sidebar-status` au montage et poll toutes les 2s quand un sync est en cours
- [ ] 2.2 Écrire les tests unitaires pour le hook `useSidebarStatus`

## 3. Composant Sidebar

- [ ] 3.1 Réordonner `CONFIG_ITEMS` dans `app-sidebar.tsx` : Settings → Team → Sync
- [ ] 3.2 Remplacer le hook `useSyncStatus` par `useSidebarStatus` dans `AppSidebar`
- [ ] 3.3 Ajouter les icônes de statut (`CheckCircle2`, `AlertCircle`, `Loader2`) sur chaque item du groupe Configuration
- [ ] 3.4 Supprimer le composant `SyncStatusIndicator` interne et le remplacer par un composant `ConfigStatusIndicator` générique

## 4. Tests

- [ ] 4.1 Mettre à jour `app-sidebar.test.tsx` : vérifier le nouvel ordre des items (Settings, Team, Sync)
- [ ] 4.2 Ajouter des tests pour les indicateurs de statut sur chaque item (check vert, alert ambre, loader, alert rouge)
- [ ] 4.3 Vérifier que le polling s'active/désactive correctement selon le statut sync

## 5. Nettoyage

- [ ] 5.1 Supprimer le hook `use-sync-status.ts` s'il n'est plus utilisé ailleurs dans l'application
- [ ] 5.2 Mettre à jour la spec `openspec/specs/sidebar-nav-groups/spec.md` avec le nouvel ordre des items
