## Context

Le sidebar de l'application utilise le composant `AppSidebar` (`src/components/app-sidebar.tsx`) avec deux groupes de navigation : "Analyse" et "Configuration". Le groupe Configuration contient actuellement les items Team, Sync, Settings dans cet ordre.

Seul l'item "Sync" possède un indicateur de statut (emoji running/success/error), implémenté via un hook `useSyncStatus` qui poll `/api/sync`. Les autres items n'ont aucun feedback visuel sur leur état de configuration.

Les données nécessaires pour déterminer le statut de chaque section sont déjà disponibles côté serveur :
- **Settings** : `hasSetting("github_pat")` et `hasSetting("github_repo")` dans `src/db/settings.ts`
- **Team** : comptage des `teamMembers` dans `src/db/team-members.ts`
- **Sync** : `getLatestSyncRun()` dans `src/db/sync-runs.ts`

## Goals / Non-Goals

**Goals:**
- Réordonner le groupe Configuration : Settings → Team → Sync (ordre logique de setup)
- Afficher un indicateur visuel (✅ ou ⚠️) sur chaque item du groupe Configuration
- Fournir un endpoint API unique pour récupérer tous les statuts de configuration

**Non-Goals:**
- Modifier le contenu des pages Settings, Team, ou Sync
- Ajouter un wizard/assistant de configuration guidé
- Bloquer la navigation vers les pages non-configurées
- Modifier le groupe "Analyse"

## Decisions

### 1. Un seul endpoint API `/api/sidebar-status`

**Choix** : Créer un endpoint unique qui agrège les statuts de toutes les sections de configuration.

**Alternatives considérées** :
- Appeler chaque endpoint existant séparément (`/api/settings/github-pat`, `/api/team`, `/api/sync`) — rejeté car cela fait 3+ requêtes au lieu d'une, et couple le sidebar aux formats de réponse de chaque endpoint
- Utiliser des Server Components pour le sidebar — rejeté car le sidebar est déjà un Client Component (nécessaire pour le polling de sync status)

**Format de réponse** :
```json
{
  "settings": { "configured": true },
  "team": { "configured": true },
  "sync": { "hasRun": true, "status": "success" | "error" | "running" | null }
}
```

### 2. Icônes Lucide au lieu d'emojis

**Choix** : Utiliser les icônes Lucide `CheckCircle2` (vert) et `AlertCircle` (ambre) pour les indicateurs de statut.

**Alternatives considérées** :
- Emojis (comme pour Sync actuellement) — rejeté pour manque de cohérence visuelle et de contrôle sur la taille/couleur
- Dots colorés — rejeté car moins explicite qu'une icône sémantique

**Migration** : Le sync status passera aussi des emojis aux icônes Lucide pour uniformiser le rendu.

### 3. Hook `useSidebarStatus` avec polling conditionnel

**Choix** : Créer un hook dédié qui fetch `/api/sidebar-status` au montage et poll uniquement quand un sync est en cours (même logique que `useSyncStatus` actuel).

**Rationale** : Le statut de configuration (settings, team) ne change pas fréquemment, donc un seul fetch au montage suffit. Le polling n'est nécessaire que pour le sync status en cours.

### 4. Ordre des items : Settings → Team → Sync

**Choix** : Placer Settings en premier car c'est le prérequis logique (GitHub PAT → Repo → Team → Sync).

**Critères "configured"** :
- **Settings** : `configured = true` si GitHub PAT **ET** GitHub Repository sont tous deux configurés
- **Team** : `configured = true` si au moins 1 membre d'équipe existe
- **Sync** : affiche le statut du dernier sync run, ou l'icône d'avertissement si aucun sync n'a jamais été lancé

## Risks / Trade-offs

- **[Changement d'habitude utilisateur]** → L'ordre des items change, ce qui peut désorienter les utilisateurs existants. Mitigation : le changement est mineur (3 items) et l'ordre logique rend la navigation plus intuitive.
- **[Performance du polling]** → Un endpoint API supplémentaire est appelé au montage du sidebar. Mitigation : les requêtes DB sont légères (hasSetting + count + getLatest) et ne se font qu'une fois au chargement.
- **[Breaking change sur les emojis de sync]** → Les tests existants vérifient les emojis (✅, ❌, 🔄). Mitigation : les tests seront mis à jour pour vérifier les icônes Lucide à la place.
