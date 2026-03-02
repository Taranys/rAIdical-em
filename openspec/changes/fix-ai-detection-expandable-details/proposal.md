## Why

La détection AI/human/mixed/bot des PRs repose uniquement sur les trailers `Co-Authored-By` dans les messages de commits. En pratique, cette heuristique rate des cas courants (PRs faites via Claude Code sans co-author explicite, squash merges qui perdent les trailers, outils AI qui n'ajoutent pas de co-author). L'EM n'a aucune visibilité sur *pourquoi* une PR est classée dans une catégorie, ce qui rend difficile la vérification et le débogage. De plus, quand une barre du chart montre "3 mixed", il est impossible de savoir quelles PRs sont concernées.

## What Changes

- **Stocker la raison de classification** : ajouter un champ `classificationReason` à la table `pull_requests` pour persister le détail de pourquoi chaque PR est classée AI/human/mixed/bot (ex: "All 3 commits have Co-Authored-By matching *Claude*", "Author dependabot[bot] is in bot list", "No AI co-author found in 5 commits")
- **Enrichir la fonction `classifyPullRequest`** pour retourner un objet `{ classification, reason }` au lieu d'un simple string
- **Nouveau endpoint API** : `GET /api/dashboard/ai-ratio/details?author=X&startDate=Y&endDate=Z` retournant la liste des PRs d'un auteur avec leur classification et la raison
- **Vue expandable par personne** dans le composant `AiRatioCard` : cliquer sur une barre du chart ouvre un panneau/accordéon montrant la liste des PRs de cette personne, avec pour chaque PR : titre, numéro, catégorie (badge coloré), et raison du classement
- **Bouton "Reclassifier"** dans la card AI ratio : permet de relancer un sync GitHub complet (re-fetch des commits) pour mettre à jour la classification et les raisons de toutes les PRs. Utile après avoir changé la config des heuristiques ou pour remplir les raisons des PRs sync'ées avant cette feature.

## Capabilities

### New Capabilities
- `ai-classification-reason`: Stocker et exposer la raison textuelle de classification AI pour chaque PR
- `ai-ratio-pr-details`: Vue expandable par personne dans le dashboard AI ratio montrant les PRs individuelles et leur raison de classement
- `ai-ratio-resync-button`: Bouton dans la card AI ratio pour relancer un sync complet et reclassifier toutes les PRs

### Modified Capabilities
- `commit-based-pr-classification`: La fonction de classification retourne désormais un objet `{ classification, reason }` au lieu d'un simple string. La raison est persistée en base.

## Impact

- **Schema DB** : migration pour ajouter la colonne `classification_reason` à `pull_requests`
- **`src/lib/ai-detection.ts`** : modification du type de retour de `classifyPullRequest`
- **`src/lib/github-sync.ts`** : adaptation pour stocker la raison
- **`src/db/pull-requests.ts`** : nouveau champ dans `PullRequestInput`, nouvelle query pour le détail par auteur
- **`src/db/schema.ts`** : ajout de la colonne
- **`src/app/api/dashboard/ai-ratio/`** : nouveau route handler pour les détails
- **`src/app/ai-ratio-card.tsx`** : ajout de l'UI expandable
- **`src/app/ai-ratio-card.tsx`** : ajout du bouton de resync
- **Tests** : mise à jour des tests unitaires de `ai-detection.ts`, nouveaux tests pour l'endpoint et le composant
