# Page NiveauxList

**Route :** `/niveaux`
**Dossier :** `src/pages/NiveauxList/`
**Fichier principal :** `NiveauxList.tsx`

---

## Rôle

Gestion des niveaux scolaires (6ème, 5ème, etc.). Affiche la liste avec les matières associées, et permet la création, modification, suppression.

---

## Données requises

```typescript
// Hook: useNiveauxListData()
// Endpoint: GET /read/niveaux?anneeLabel=?

interface NiveauxListData {
  niveaux: Array<{
    id: string; nom: string; ordre: number; description?: string
    matiere_ids: string[]
    matieres: Array<{ id: string; nom: string; code: string; couleur?: string }>
    nb_classes: number
  }>
}
```

---

## Structure UI

```
PageHeader "Niveaux scolaires"
  └─ Bouton "Nouveau niveau" → /niveaux/nouveau

Liste des niveaux (triée par ordre)
  Pour chaque niveau:
    ├─ Nom du niveau + ordre
    ├─ Nombre de classes
    ├─ MatierePills: pastilles colorées des matières
    └─ Actions: Modifier (modal inline), Supprimer (ConfirmDialog)
```

---

## Modification inline

- Clic "Modifier" → modal avec champs : nom, ordre, description, matières (multi-select)
- Soumission : `NiveauContext.update(id, data)`

---

## Suppression

- ConfirmDialog : "Supprimer ce niveau ?"
- Bloqué si le niveau a des classes actives
- Soumission : `NiveauContext.delete(id)`

---

## Dépendances

- `src/hooks/usePageData.ts` → `useNiveauxListData`
- `src/contexts/NiveauContext.tsx`
- `src/components/shared/MatierePills.tsx`
- `src/components/shared/Modal.tsx`
- `src/components/shared/ConfirmDialog.tsx`

---

# Page CreateNiveau

**Route :** `/niveaux/nouveau`
**Dossier :** `src/pages/CreateNiveau/`

---

## Champs du formulaire

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `nom` | text | oui (ex: "6ème") |
| `ordre` | number | oui (1, 2, 3…) |
| `description` | textarea | non |
| `matiere_ids` | multi-select | non |

## Soumission

```typescript
// NiveauContext.create(data)
// POST /niveaux
```

Après succès → `/niveaux`
