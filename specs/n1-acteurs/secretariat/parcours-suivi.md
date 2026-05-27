<a id="PA-SEC-005"></a>
# PA-SEC-005 — Suivre l'assiduité et le comportement

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Secrétariat](_index.md)
> **Domaine fonctionnel** : Suivi élève

---

## Références

| Type | Lien |
|------|------|
| BC Suivi | [bc-suivi/_index.md](../../n2a-domaine/bc-suivi/_index.md) |
| Pages IHM | [n2b-ihm/eleves/page-fiche-eleve.md](../../n2b-ihm/eleves/page-fiche-eleve.md) |

---

## Parcours 1 — Enregistrer une absence ou un retard

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Ouvrir la fiche de l'élève → onglet Assiduité | — | — |
| 2 | Cliquer "Ajouter une absence" | UC-SUI-001 | — |
| 3 | Choisir le type (absence / retard), la date, la durée, le motif | UC-SUI-001 | — |
| 4 | Cocher "Justifiée" si justificatif reçu | UC-SUI-001 | — |
| 5 | Valider → enregistré dans la liste des absences | UC-SUI-001 | — |

## Parcours 2 — Saisir un avertissement

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Ouvrir la fiche de l'élève → onglet Avertissements | — | — |
| 2 | Cliquer "Ajouter un avertissement" | UC-SUI-002 | — |
| 3 | Choisir le type (comportement, dégâts, absence, autre), saisir le motif et un commentaire | UC-SUI-002 | — |
| 4 | Valider → avertissement enregistré | UC-SUI-002 | — |
| 5 | Si 3e avertissement : convocation automatiquement générée | UC-SUI-003 | — |

## Parcours 3 — Gérer les convocations

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Ouvrir la fiche de l'élève → onglet Avertissements | — | — |
| 2 | Consulter la liste des convocations | — | — |
| 3 | Marquer une convocation comme effectuée | UC-SUI-004 | — |
| 4 | Les convocations en attente apparaissent aussi dans le tableau de bord | — | — |

## Résultat

Suivi complet de l'assiduité et du comportement de chaque élève. Convocations visibles en tableau de bord.
