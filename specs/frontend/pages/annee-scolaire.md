# Page AnneeScolaire

**Route :** `/annee-scolaire`
**Dossier :** `src/pages/AnneeScolaire/`
**Fichier principal :** `AnneeScolaire.tsx`

---

## Rôle

Gestion du cycle des années scolaires : création, démarrage, clôture, et consultation des archives. C'est depuis cette page qu'on active le mode archive pour consulter les données historiques.

---

## Données requises

Les données viennent de `AnneeContext` (état local maintenu par le contexte) :

```typescript
// AnneeContext
{
  annees: AnneeScolaire[]
  anneeActive: AnneeScolaire | null
  anneePreparation: AnneeScolaire | null
}
```

---

## Structure UI

```
PageHeader "Année scolaire"

Section "Année en cours"
  └─ Si anneeActive:
       ├─ Label (ex: "2024-2025")
       ├─ Dates début/fin
       ├─ Statut badge "Active"
       ├─ Historique des actions (log)
       └─ Bouton "Clôturer l'année" → modal confirmation

Section "En préparation"
  └─ Si anneePreparation:
       ├─ Label, dates
       ├─ Statut badge "Préparation"
       └─ Bouton "Démarrer" → modal confirmation
  └─ Sinon: Bouton "Préparer une nouvelle année"

Section "Archives"
  └─ Liste des années terminées
       Chaque année: label, dates, bouton "Consulter"

PipelineStep: visualisation des 3 états (preparation → active → terminee)
```

---

## Interactions

### Préparer une nouvelle année
- Modal formulaire : `{ label, debut, fin }`
- `AnneeContext.create(data)` → `POST /annees`
- Validation : label unique, une seule année en préparation à la fois

### Démarrer une année
- ConfirmDialog : "Démarrer l'année XXXX-XXXX ?"
- `AnneeContext.demarrer(id)` → `PATCH /annees/:id/demarrer`
- L'année active précédente passe en "terminee"

### Clôturer une année
- ConfirmDialog avec avertissement (irréversible)
- `AnneeContext.terminer(id)` → `PATCH /annees/:id/terminer`

### Consulter une archive
- `ViewingContext.viewAnnee(annee)` → charge le snapshot
- Navigation vers `/dashboard` (toujours en mode archive)
- `ArchiveBanner` apparaît sur toutes les pages
- Bouton "Quitter la consultation" → `ViewingContext.exitView()`

---

## PipelineStep

Composant visuel qui représente les étapes du cycle d'une année scolaire :
```
Préparation → Active → Terminée
     ○    →    ●    →    ✓
```

---

## Dépendances

- `src/contexts/AnneeContext.tsx`
- `src/contexts/ViewingContext.tsx`
- `src/components/shared/PipelineStep.tsx`
- `src/components/shared/Modal.tsx`
- `src/components/shared/ConfirmDialog.tsx`
- `src/components/shared/AuditEntry.tsx`
