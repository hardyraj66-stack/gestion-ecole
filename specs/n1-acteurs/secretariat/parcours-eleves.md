<a id="PA-SEC-002"></a>
# PA-SEC-002 — Gérer les élèves

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Secrétariat](_index.md)
> **Domaine fonctionnel** : Élèves

---

## Références

| Type | Lien |
|------|------|
| BC Élèves | [bc-eleves/_index.md](../../n2a-domaine/bc-eleves/_index.md) |
| BC Suivi | [bc-suivi/_index.md](../../n2a-domaine/bc-suivi/_index.md) |
| Pages IHM | [n2b-ihm/eleves/_index.md](../../n2b-ihm/eleves/_index.md) |

---

## Objectif

Inscrire de nouveaux élèves, consulter et modifier les dossiers existants, gérer les changements de statut (exclusion, départ, réintégration).

---

## Parcours 1 — Inscrire un nouvel élève

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Cliquer sur "Nouvel élève" depuis la liste | — | [PAGE-ELV-003](../../n2b-ihm/eleves/page-creer-eleve.md) |
| 2 | Renseigner les informations personnelles (nom, prénom, date naissance, genre, classe) | UC-ELV-001 | — |
| 3 | Renseigner optionnellement les informations famille (père, mère ou tuteur) | UC-ELV-001 | — |
| 4 | Valider → élève créé, redirigé vers sa fiche | UC-ELV-001 | [PAGE-ELV-002](../../n2b-ihm/eleves/page-fiche-eleve.md) |

## Parcours 2 — Consulter et modifier un dossier élève

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Rechercher l'élève dans la liste (nom, prénom ou classe) | UC-ELV-002 | [PAGE-ELV-001](../../n2b-ihm/eleves/page-liste-eleves.md) |
| 2 | Cliquer sur l'élève → fiche complète | — | [PAGE-ELV-002](../../n2b-ihm/eleves/page-fiche-eleve.md) |
| 3 | Onglet Identité : modifier les infos via bouton Modifier | UC-ELV-003 | — |
| 4 | Onglet Famille : consulter les contacts des parents | — | — |
| 5 | Onglet Assiduité : consulter et ajouter des absences | UC-SUI-001 | — |
| 6 | Onglet Avertissements : consulter et ajouter des avertissements | UC-SUI-002 | — |
| 7 | Consulter le bulletin → bouton "Bulletin" | UC-NOT-003 | [PAGE-ELV-004](../../n2b-ihm/eleves/page-bulletin.md) |

## Parcours 3 — Gérer le statut d'un élève

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Ouvrir la fiche de l'élève → onglet Statut | — | — |
| 2a | **Exclure** : cliquer "Exclure l'élève", renseigner raison et commentaire, confirmer | UC-ELV-004 | — |
| 2b | **Départ** : cliquer "Élève parti", choisir le motif, confirmer | UC-ELV-005 | — |
| 2c | **Réintégrer** (si exclu) : cliquer "Réintégrer", confirmer | UC-ELV-006 | — |

## Résultat

Dossier élève complet et à jour. Changements de statut tracés avec les détails de l'exclusion ou du départ.

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Aucune classe disponible lors de l'inscription | Champ classe vide, validation bloquée |
| Tentative de modification en mode archive | Boutons de modification masqués / désactivés |
