<a id="PAGE-PLN-002"></a>
# Planning d'une classe

> **Couche** : N2b — QUOI écrans (page : Planning d'une classe)
> **Acteur concerné** : Secrétariat
> **UC sous-jacents** : [UC-PLN-001](../../n2a-domaine/bc-planning/_index.md), [UC-PLN-002](../../n2a-domaine/bc-planning/_index.md), [UC-PLN-003](../../n2a-domaine/bc-planning/_index.md), [UC-PLN-004](../../n2a-domaine/bc-planning/_index.md)
> **Type de page** : Grille calendrier interactive
> **Route** : `/planning/:classeId`
> **Hook de données** : `usePlanningClasse` → `GET /read/planning/classes/:id`
> **Ce fichier contient** : grille semaine, création par drag-and-drop, actions par créneau
> **Ce fichier NE contient PAS** : logique métier (→ N2a)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  ← Planning  |  6ème A     [+ Nouveau créneau] [Fusionner]  │
├──────────────────────────────────────────────────────────────┤
│        | Lundi   | Mardi   | Mercredi | Jeudi  | Vendredi   │
│  08:00 │         │ MATH    │          │        │ FRANÇAIS   │
│  09:00 │ SVT     │ MATH    │ HIST-GEO │        │            │
│  10:00 │ SVT     │         │          │ ANGLAIS│            │
│  ...   │         │         │          │        │            │
└──────────────────────────────────────────────────────────────┘
```

---

## Grille hebdomadaire

- Axes : jours (Lundi–Samedi) × heures (08h00–18h00 par créneaux de 30 min)
- Chaque créneau est affiché comme un bloc coloré (couleur de la matière)
- Bloc affiche : nom matière + salle

---

## Interaction — Créer un créneau

1. Cliquer sur une cellule vide ou « + Nouveau créneau »
2. Sélectionner : matière, jour, heure début, heure fin, salle
3. Valider → `POST /planning`

---

## Interaction — Déplacer un créneau (Drag & Drop)

1. Faire glisser un bloc vers une nouvelle cellule
2. Le système met à jour jour + heure_debut + heure_fin
3. `PATCH /planning/:id`

---

## Interaction — Modifier/Supprimer un créneau

Cliquer sur un créneau → menu contextuel :
- Modifier → formulaire → `PATCH /planning/:id`
- Supprimer → confirmation → `DELETE /planning/:id`

---

## Bouton Fusionner

Déclenche `POST /planning/merge/:classeId` — fusionne automatiquement les créneaux adjacents de même matière. Affiche le nombre de fusions effectuées en toast.

---

## Sélecteur de salle en création/modification

- Appelle `GET /salles/disponibles?jour=&heure_debut=&heure_fin=&excludeCreneauId=`
- Affiche uniquement les salles libres sur le créneau souhaité
