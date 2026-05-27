<a id="PAGE-PLN-001"></a>
# Vue globale du planning

> **Couche** : N2b — QUOI écrans (page : Vue globale planning)
> **Acteur concerné** : Secrétariat, Direction
> **UC sous-jacents** : (lecture)
> **Type de page** : Vue grille
> **Route** : `/planning`
> **Hook de données** : `usePlanningClasses` → `GET /read/planning/classes`
> **Ce fichier contient** : liste des classes, navigation vers le planning d'une classe
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  Planning des classes                                         │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  6ème A  │ │  6ème B  │ │  5ème A  │ │   ...    │        │
│  │ 24h/sem  │ │ 22h/sem  │ │ 26h/sem  │ │          │        │
│  │[Voir →]  │ │[Voir →]  │ │[Voir →]  │ │[Voir →]  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## Cartes de classe

Chaque classe affiche :
- Nom de la classe
- Niveau
- Nombre d'heures/semaine planifiées
- Bouton « Voir le planning »

**Interaction** : cliquer sur une carte ou « Voir le planning » navigue vers `/planning/:classeId`
