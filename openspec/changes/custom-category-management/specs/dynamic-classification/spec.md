## ADDED Requirements

### Requirement: Prompt LLM dynamique basé sur les catégories custom
Le classifier LLM DOIT construire le prompt de classification en utilisant les catégories custom (si elles existent) au lieu des catégories hardcodées.

#### Scenario: Classification avec catégories custom
- **WHEN** des catégories custom existent et qu'un commentaire est classifié
- **THEN** le prompt LLM contient uniquement les catégories custom avec leurs descriptions comme instructions de classification

#### Scenario: Classification sans catégories custom (fallback)
- **WHEN** aucune catégorie custom n'existe et qu'un commentaire est classifié
- **THEN** le prompt LLM utilise les 8 catégories par défaut hardcodées (comportement actuel inchangé)

#### Scenario: Format du prompt pour les catégories custom
- **WHEN** le prompt est construit avec des catégories custom
- **THEN** chaque catégorie apparaît sous la forme `- <slug>: <description>` et la réponse attendue référence le slug

### Requirement: Reclassification de tous les commentaires
Le système DOIT permettre de relancer la classification de tous les commentaires existants avec les catégories actuelles.

#### Scenario: Déclenchement de la reclassification
- **WHEN** l'utilisateur clique sur "Reclassifier tous les commentaires" sur la page `/settings/categories`
- **THEN** un nouveau `classification_run` est créé, les classifications non-manuelles existantes sont supprimées, et la classification batch est relancée

#### Scenario: Préservation des classifications manuelles
- **WHEN** une reclassification est lancée et que certains commentaires ont des classifications manuelles (`isManual=1`)
- **THEN** ces classifications manuelles sont préservées et non recalculées

#### Scenario: Feedback de progression
- **WHEN** une reclassification est en cours
- **THEN** la page affiche une barre de progression avec le nombre de commentaires traités / total

### Requirement: Adaptation dynamique des couleurs et labels
Les composants d'affichage (charts, filtres, badges) DOIVENT utiliser les couleurs et labels des catégories custom quand elles existent.

#### Scenario: Charts avec catégories custom
- **WHEN** des catégories custom sont définies et que l'utilisateur consulte la page Review Quality
- **THEN** les charts (donut, bar, trend) utilisent les couleurs et labels des catégories custom

#### Scenario: Filtres avec catégories custom
- **WHEN** des catégories custom sont définies et que l'utilisateur utilise les filtres de la page Review Quality
- **THEN** les options de filtre reflètent les catégories custom (labels et couleurs)
