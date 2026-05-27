<a id="PAGE-DASH-001"></a>
# Tableau de bord

> **Couche** : N2b — QUOI écrans (page : Tableau de bord)
> **Acteur concerné** : Direction, Secrétariat
> **UC sous-jacents** : (lecture seule — pas de use case d'écriture)
> **Type de page** : Dashboard
> **Route** : `/`
> **Hook de données** : `useDashboardData` → `GET /read/dashboard`
> **Ce fichier contient** : layout, cartes statistiques, tableau des classes, widget convocations
> **Ce fichier NE contient PAS** : logique métier (→ N2a), composants réutilisables (→ N3)

---

## Structure visuelle

```
┌──────────────────────────────────────────────────────────────┐
│  Tableau de bord                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │  N classes  │ │  N élèves   │ │  N absences │ │  N     │ │
│  │  actives    │ │  inscrits   │ │  aujourd'hui│ │  conv. │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│                                                               │
│  ┌─ Classe par classe ────────────────────────────────────┐  │
│  │  Nom | Niveau | Effectif | Nb absences | Moy. générale │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Convocations en attente ──────────────────────────────┐  │
│  │  Élève | Classe | Date | Raison                         │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## Cartes statistiques (StatCard)

| Carte | Donnée | Couleur |
|-------|--------|---------|
| Classes actives | `stats.nb_classes` | bleu |
| Élèves inscrits | `stats.nb_eleves` | vert |
| Absences du jour | `stats.nb_absences_jour` | orange |
| Convocations en attente | `stats.nb_convocations` | rouge |

---

## Tableau des classes

| Colonne | Source | Tri |
|---------|--------|-----|
| Nom | `classe.nom` | oui |
| Niveau | `classe.niveau` | oui |
| Effectif | `classe.nb_eleves` | oui |
| Absences | `classe.nb_absences` | — |
| Moyenne | `classe.moyenne_generale` | — |

**Interaction** : cliquer sur une ligne navigue vers la page élèves de la classe (`/classes/:id/eleves`).

---

## Widget Convocations

Liste des convocations non effectuées (`effectuee: false`), triées par date.

| Colonne | Source |
|---------|--------|
| Élève | `nom prenom` |
| Classe | `classe_nom` |
| Date | `date` |
| Raison | `raison` |

---

## États vides

| Situation | Affichage |
|-----------|-----------|
| Aucune classe | « Bienvenue ! Commencez par créer des classes. » |
| Aucune convocation | Widget masqué ou « Aucune convocation en attente » |
