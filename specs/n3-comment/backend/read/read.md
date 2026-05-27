# Module Read — Endpoints /read/*

> **Couche** : N3 — COMMENT (module read)
> **Ce fichier contient** : tous les endpoints du ReadController, leurs paramètres et la forme des réponses
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails écrans (→ N2b)

---

## Vue d'ensemble

Le module `Read` implémente le côté lecture d'un pattern CQRS simplifié. Tous les endpoints `GET /read/*` retournent des vues pré-composées, dénormalisées et paginées — optimisées pour chaque page frontend.

**ReadController** → **ReadService** → Collections `read-*` (ou MongoDB aggregations)

---

## Gestion du mode archive

Tous les endpoints acceptent un paramètre optionnel `anneeLabel` (query string). Quand fourni :
- `resolveAnneeLabel(anneeLabel)` retourne le snapshot de l'année demandée
- Les données servies sont celles du snapshot, pas les données live
- Ceci permet au frontend de naviguer en mode archive sans code supplémentaire

---

## Endpoints

### GET /read/dashboard
**Paramètres** : `anneeLabel?`
**Réponse** :
```json
{
  "stats": {
    "nb_classes": 15,
    "nb_eleves": 347,
    "nb_absences_jour": 12,
    "nb_convocations": 3
  },
  "classes": [{ "id", "nom", "niveau", "nb_eleves", "nb_absences", "moyenne_generale" }],
  "convocations_en_attente": [{ "eleve_nom", "classe_nom", "date", "raison" }]
}
```

---

### GET /read/classes
**Paramètres** : `page?`, `limit?`, `search?`, `niveau?`, `anneeLabel?`
**Réponse** :
```json
{
  "data": [{ "id", "nom", "niveau", "nb_eleves", "salle", "salle_type", "actif" }],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

---

### GET /read/classes/:id/eleves
**Paramètres** : `anneeLabel?`
**Réponse** :
```json
{
  "classe": { "id", "nom", "niveau", "annee_scolaire" },
  "stats": { "nb_eleves", "nb_filles", "nb_garcons", "nb_absences" },
  "eleves": [{ "id", "nom", "prenom", "genre", "date_naissance", "statut" }]
}
```

---

### GET /read/eleves
**Paramètres** : `page?`, `limit?`, `search?`, `classe_id?`, `statut?`, `anneeLabel?`
**Réponse** :
```json
{
  "data": [{ "id", "nom", "prenom", "genre", "classe_nom", "niveau", "statut" }],
  "total": 347,
  "page": 1,
  "limit": 20
}
```

---

### GET /read/eleves/:id/fiche
**Paramètres** : `anneeLabel?`
**Réponse** : objet complet de la fiche élève (infos personnelles, famille, classe actuelle, historique)

---

### GET /read/eleves/:id/bulletin
**Paramètres** : `trimestre`, `anneeLabel?`
**Réponse** :
```json
{
  "eleve": { "nom", "prenom", "classe_nom", "niveau" },
  "trimestre": 1,
  "matieres": [{ "nom", "coefficient", "moyenne_eleve", "moyenne_classe" }],
  "moyenne_generale": 13.2,
  "rang": 8,
  "nb_eleves": 28
}
```

---

### GET /read/matieres
**Paramètres** : `anneeLabel?`
**Réponse** : tableau de matières avec coefficients par niveau

---

### GET /read/salles
**Paramètres** : `search?`, `type?`, `batiment?`
**Réponse** : tableau de salles actives

---

### GET /read/planning/classes
**Paramètres** : `anneeLabel?`
**Réponse** : tableau de classes avec nombre d'heures hebdomadaires planifiées

---

### GET /read/planning/classes/:id
**Paramètres** : `anneeLabel?`
**Réponse** :
```json
{
  "classe": { "id", "nom", "niveau" },
  "creneaux": [{ "id", "jour", "heure_debut", "heure_fin", "matiere_nom", "matiere_couleur", "salle" }]
}
```

---

### GET /read/notes
**Paramètres** : `classe_id`, `matiere_id`, `trimestre`, `anneeLabel?`
**Réponse** : tableau de notes pour le triplet (classe, matière, trimestre)

---

### GET /read/notes/filters
**Paramètres** : `anneeLabel?`
**Réponse** : listes des classes et matières pour alimenter les filtres de la page Notes

---

### GET /read/niveaux
**Réponse** : tableau de niveaux triés par `ordre`, avec leur liste de matières

---

### GET /read/classes-par-niveau
**Réponse** : `[{ niveau, classes: [...] }]` — classes groupées par niveau

---

### GET /read/professeurs
**Paramètres** : `includeInactifs?`
**Réponse** : tableau de professeurs avec leur nombre d'affectations

---

### GET /read/professeurs/actifs
**Réponse** : tableau des professeurs avec `statut: 'actif'` uniquement

---

### GET /read/professeurs/:id
**Réponse** : objet professeur + tableau de ses affectations (classe + matière)

---

### GET /read/periodes
**Paramètres** : `annee_scolaire?`
**Réponse** : tableau des 6 périodes (3 trimestres × DS + Évaluation)

---

### GET /read/periodes/active
**Réponse** : la période active (en cours) ou `null`

---

### GET /read/evaluations
**Paramètres** : `classe_id?`, `trimestre?`, `type?`, `statut?`, `anneeLabel?`
**Réponse** : tableau d'évaluations avec détails

---

### GET /read/evaluations/:id
**Réponse** : objet évaluation complet + liste des élèves de la classe avec leur note

---

### GET /read/create-classe-data
**Réponse** : `{ niveaux, salles }` — données nécessaires au formulaire de création de classe

---

### GET /read/create-eleve-data
**Paramètres** : `classeId?`
**Réponse** : `{ classes }` — liste des classes pour le formulaire d'inscription
