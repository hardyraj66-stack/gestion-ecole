<a id="PAGE-SAL-002"></a>
# Détail d'une salle

> **Couche** : N2b — QUOI écrans (page : Détail salle)
> **Acteur concerné** : Direction
> **UC sous-jacents** : [UC-SAL-002](../../n2a-domaine/bc-salles/_index.md)
> **Type de page** : Fiche détail
> **Route** : `/salles/:id`
> **Données** : `GET /salles/:id/stats`
> **Ce fichier contient** : statistiques, liste des créneaux utilisant la salle
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Sections

### Informations générales

- Nom, type, capacité, bâtiment, étage
- Équipements (badges)
- Accessibilité PMR

### Statistiques d'occupation

| Donnée | Source |
|--------|--------|
| Créneaux/semaine | `stats.creneaux_par_semaine` |
| Taux d'occupation | `stats.taux_occupation` (en %) |

### Créneaux utilisant cette salle

Tableau des cours planifiés dans cette salle :

| Colonne | Source |
|---------|--------|
| Classe | `classe_nom` |
| Matière | `matiere_nom` |
| Jour | `jour` |
| Horaire | `heure_debut → heure_fin` |
