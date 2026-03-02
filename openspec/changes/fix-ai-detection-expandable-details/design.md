## Context

Le dashboard AI ratio affiche un stacked bar chart par membre de l'équipe avec les catégories AI/human/mixed/bot. La classification repose sur `classifyPullRequest()` dans `src/lib/ai-detection.ts` qui analyse les trailers `Co-Authored-By` des commits. Le résultat est un simple string (`AiClassification`) stocké dans la colonne `ai_generated` de la table `pull_requests`.

Problèmes actuels :
1. **Pas de transparence** : impossible de savoir pourquoi une PR est classée dans une catégorie
2. **Pas de drill-down** : le chart montre des agrégats mais on ne peut pas voir les PRs individuelles
3. **Débogage difficile** : quand la classification semble incorrecte, il faut aller chercher manuellement les commits

## Goals / Non-Goals

**Goals:**
- Persister la raison textuelle de classification pour chaque PR en base de données
- Exposer un endpoint API pour récupérer les PRs individuelles d'un auteur avec leur classification et raison
- Offrir une vue expandable par personne dans le chart AI ratio pour inspecter les PRs et comprendre le classement

**Non-Goals:**
- Modifier les heuristiques de détection elles-mêmes (pas de nouveaux signaux comme labels ou branch names)
- Permettre la reclassification manuelle des PRs (feature séparée potentielle)
- Modifier l'UI du stacked bar chart lui-même

## Decisions

### 1. Retour structuré de `classifyPullRequest`

**Décision** : La fonction retourne `{ classification: AiClassification, reason: string }` au lieu d'un simple `AiClassification`.

**Alternatives considérées** :
- *Calculer la raison après coup à la lecture* : plus complexe, résultat potentiellement différent si la config a changé entre-temps
- *Stocker les données brutes des commits* : trop verbeux, la raison textuelle suffit

**Rationale** : Capturer la raison au moment de la classification garantit qu'elle reflète exactement la logique et la config utilisées.

### 2. Colonne `classification_reason` en base

**Décision** : Ajouter une colonne `classification_reason TEXT` (nullable) à la table `pull_requests`.

**Rationale** : Nullable pour ne pas casser les données existantes. Les PRs déjà sync'ées auront `null` — la raison sera remplie au prochain sync. Simple migration Drizzle.

### 3. Endpoint API dédié pour les détails

**Décision** : Créer `GET /api/dashboard/ai-ratio/details?author=X&startDate=Y&endDate=Z` retournant les PRs individuelles.

**Alternatives considérées** :
- *Enrichir l'endpoint existant `/api/dashboard/ai-ratio`* : alourdirait la réponse pour tous les appels même quand le détail n'est pas nécessaire
- *Charger côté client depuis un endpoint PR générique* : pas de endpoint PR existant avec ce filtrage exact

**Rationale** : Endpoint dédié qui ne charge les données que quand l'utilisateur expand un auteur. Lazy loading pour la performance.

### 4. UI avec Collapsible/Accordion par auteur

**Décision** : Au clic sur une barre du chart, ouvrir un panneau collapsible sous le chart listant les PRs de cet auteur. Utiliser les composants shadcn/ui `Collapsible` (ou `Accordion`).

**Alternatives considérées** :
- *Sheet/Dialog latéral* : trop lourd pour un simple drill-down
- *Tooltip enrichi* : pas assez de place pour la liste de PRs

**Rationale** : Le collapsible s'intègre naturellement dans le flow de lecture du card et ne masque pas le chart.

## Risks / Trade-offs

- **Migration de données** : Les PRs existantes auront `classification_reason = null`. → Mitigation : afficher "Raison non disponible — resynchroniser pour obtenir le détail" dans l'UI.
- **Performance de l'endpoint détails** : Si un auteur a beaucoup de PRs sur une longue période. → Mitigation : la requête est déjà filtrée par auteur + date range, pas de pagination nécessaire dans un premier temps (le nombre de PRs par personne sur une période dashboard est typiquement < 100).
- **Changement de type de retour `classifyPullRequest`** : breaking change interne. → Mitigation : tous les call sites sont dans `github-sync.ts`, un seul endroit à adapter. Les tests de `ai-detection.ts` devront être mis à jour.
