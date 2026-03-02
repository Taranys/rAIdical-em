## 1. API Endpoint

- [x] 1.1 Créer `src/app/api/sidebar-status/route.ts` avec le handler GET qui retourne le statut de configuration (settings, team, sync)
- [x] 1.2 Écrire les tests unitaires pour le endpoint `/api/sidebar-status` (tous configurés, rien configuré, partiellement configuré)

## 2. Hook Client

- [x] 2.1 Créer `src/hooks/use-sidebar-status.ts` — hook qui fetch `/api/sidebar-status` au montage et poll toutes les 2s quand un sync est en cours
- [x] 2.2 Écrire les tests unitaires pour le hook `useSidebarStatus`

## 3. Composant Sidebar

- [x] 3.1 Réordonner `CONFIG_ITEMS` dans `app-sidebar.tsx` : Settings → Team → Sync
- [x] 3.2 Remplacer le hook `useSyncStatus` par `useSidebarStatus` dans `AppSidebar`
- [x] 3.3 Ajouter les icônes de statut (`CheckCircle2`, `AlertCircle`, `Loader2`) sur chaque item du groupe Configuration
- [x] 3.4 Supprimer le composant `SyncStatusIndicator` interne et le remplacer par un composant `ConfigStatusIndicator` générique

## 4. Tests

- [x] 4.1 Mettre à jour `app-sidebar.test.tsx` : vérifier le nouvel ordre des items (Settings, Team, Sync)
- [x] 4.2 Ajouter des tests pour les indicateurs de statut sur chaque item (check vert, alert ambre, loader, alert rouge)
- [x] 4.3 Vérifier que le polling s'active/désactive correctement selon le statut sync

## 5. Nettoyage

- [x] 5.1 ~~Supprimer le hook `use-sync-status.ts`~~ — conservé car utilisé par `sync/page.tsx`
- [x] 5.2 Mettre à jour la spec `openspec/specs/sidebar-nav-groups/spec.md` avec le nouvel ordre des items
