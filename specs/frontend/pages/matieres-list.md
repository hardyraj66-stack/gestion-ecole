# Page MatieresList

**Route :** `/matieres`
**Dossier :** `src/pages/MatieresList/`
**Fichier principal :** `MatieresList.tsx`

---

## Rôle

Affiche toutes les matières avec leur code, coefficient, et couleur. Permet de filtrer par niveau.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `MatieresList.tsx` | Page principale |
| `MatiereCard.tsx` | Carte d'une matière |

---

## Données requises

```typescript
// Hook: useMatieresListData(page, niveau)
// Endpoint: GET /read/matieres?page=N&limit=8&niveau=...

interface MatieresListData {
  items: Matiere[]
  total: number; page: number; pages: number
  niveaux: string[]    // pour le filtre
}
```

---

## Structure UI

```
PageHeader "Matières"
  └─ Bouton "Nouvelle matière" → /matieres/nouvelle

FilterBar
  └─ Select niveau

Grille MatiereCard (3-4 colonnes)

Pagination
```

---

## MatiereCard

Affiche :
- Pastille colorée (couleur de la matière)
- Nom de la matière
- Code (badge)
- Coefficient (ou coefficients par niveau)
- Description (si présente, tronquée)

---

## Dépendances

- `src/hooks/usePageData.ts` → `useMatieresListData`
- `src/components/shared/Badge.tsx`
- `src/components/shared/MatierePills.tsx`

---

# Page CreateMatiere

**Route :** `/matieres/nouvelle`
**Dossier :** `src/pages/CreateMatiere/`

---

## Composants

| Fichier | Rôle |
|---------|------|
| `CreateMatiere.tsx` | Formulaire principal |
| `MatierePreview.tsx` | Prévisualisation de la carte matière en temps réel |

---

## Champs du formulaire

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `nom` | text | oui |
| `code` | text | oui (ex: "MATH") |
| `description` | textarea | non |
| `couleur` | ColorPicker | oui |
| `coefficients` | array | oui (un par niveau) |

### Coefficients par niveau
- Pour chaque niveau existant, un champ `number` (coefficient)
- Les niveaux sont chargés depuis `/read/niveaux`

---

## MatierePreview

- Affiche en temps réel la carte matière telle qu'elle apparaîtra dans la liste
- Se met à jour à chaque modification du formulaire

---

## Soumission

```typescript
// MatiereContext.create(data)
// POST /matieres
// { nom, code, description, couleur, coefficients: CoefficientNiveau[] }
```

Après succès → `/matieres`

---

## Dépendances

- `src/contexts/MatiereContext.tsx`
- `src/services/readApi.ts` → `niveaux()`
- `src/components/shared/ColorPicker.tsx`
