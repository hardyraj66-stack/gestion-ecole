<a id="PA-DIR-001"></a>
# PA-DIR-001 — Configurer les niveaux et matières

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Direction](_index.md)
> **Domaine fonctionnel** : Niveaux / Matières

---

## Références

| Type | Lien |
|------|------|
| BC Niveaux | [bc-niveaux/_index.md](../../n2a-domaine/bc-niveaux/_index.md) |
| BC Matières | [bc-matieres/_index.md](../../n2a-domaine/bc-matieres/_index.md) |
| Pages IHM | [n2b-ihm/niveaux/](../../n2b-ihm/niveaux/_index.md), [n2b-ihm/matieres/](../../n2b-ihm/matieres/_index.md) |

---

## Objectif

Configurer la structure pédagogique de l'établissement : créer les niveaux scolaires dans l'ordre, créer les matières avec leurs coefficients par niveau, et associer les matières aux niveaux.

---

## Ordre recommandé de configuration

> La configuration doit se faire dans cet ordre : Niveaux → Matières → association Matières ↔ Niveaux → Classes.

## Parcours 1 — Créer les niveaux scolaires

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Niveaux → "Nouveau niveau" | — | [PAGE-NIV-002](../../n2b-ihm/niveaux/page-creer-niveau.md) |
| 2 | Saisir le nom (ex: "6ème"), l'ordre (ex: 1), une description optionnelle | UC-NIV-001 | — |
| 3 | Valider → niveau créé, répéter pour chaque niveau | UC-NIV-001 | — |
| 4 | Depuis la liste des niveaux, modifier un niveau pour associer des matières | UC-NIV-002 | [PAGE-NIV-001](../../n2b-ihm/niveaux/page-liste-niveaux.md) |

## Parcours 2 — Créer les matières

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Naviguer vers Matières → "Nouvelle matière" | — | [PAGE-MAT-002](../../n2b-ihm/matieres/page-creer-matiere.md) |
| 2 | Saisir le nom, le code (ex: "MATH"), une couleur et une description | UC-MAT-001 | — |
| 3 | Pour chaque niveau : saisir le coefficient de la matière dans ce niveau | UC-MAT-001 | — |
| 4 | Prévisualiser la carte en temps réel → valider | UC-MAT-001 | — |

## Résultat

Structure pédagogique complète. Les matières sont disponibles dans les formulaires de création de classe, les sélecteurs de notes, et le planning.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Suppression d'un niveau avec des classes actives | Action bloquée |
| Code matière déjà utilisé | Avertissement, création possible après vérification |
