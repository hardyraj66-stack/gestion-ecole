<a id="PAGE-NOT-002"></a>
# Bulletin trimestriel

> **Couche** : N2b — QUOI écrans (page : Bulletin)
> **Acteur concerné** : Secrétariat, Direction
> **UC sous-jacents** : (lecture seule)
> **Type de page** : Rapport / affichage
> **Route** : `/eleves/:id/bulletin` ou accessible via onglet Bulletin de la fiche élève
> **Hook de données** : `useBulletinData` → `GET /read/eleves/:id/bulletin?trimestre=N`
> **Ce fichier contient** : sections du bulletin, calculs affichés, export
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Sélecteur de trimestre

Boutons ou onglets : **Trimestre 1** / **Trimestre 2** / **Trimestre 3**

---

## Structure du bulletin

```
┌──────────────────────────────────────────────────────────────┐
│  BULLETIN — Trimestre 1 — 2024-2025                          │
│  Jean DUPONT — 6ème A                                        │
├──────────────────────────────────────────────────────────────┤
│  Matière         | Coeff | Moy. | Moy. Classe | Appréciation │
│  Mathématiques   |   3   | 14.5 |    12.3     | Bon travail  │
│  Français        |   3   | 12.0 |    13.1     | Peut mieux   │
│  ...                                                          │
├──────────────────────────────────────────────────────────────┤
│  Moyenne générale :  13.2 / 20                               │
│  Rang : 8 / 28                                               │
│  Mention : Bien                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Tableau des matières

| Colonne | Source |
|---------|--------|
| Matière | `matiere_nom` |
| Coefficient | `coefficient` du niveau |
| Moyenne élève | calculée depuis les notes non annulées |
| Moyenne de classe | calculée pour toutes les notes du trimestre |
| Appréciation | optionnel |

---

## Résumé

| Donnée | Calcul |
|--------|--------|
| Moyenne générale | Moyenne pondérée par coefficient |
| Rang | Position dans la classe sur la moyenne générale |
| Mention | Calculée depuis la moyenne (passable / assez bien / bien / très bien) |

---

## Actions

| Action | Comportement |
|--------|-------------|
| Exporter PDF | Génère un PDF du bulletin via le module Export |
| Trimestre précédent / suivant | Navigation entre les trimestres |
