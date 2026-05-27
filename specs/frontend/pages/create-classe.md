# Page CreateClasse

**Route :** `/classes/nouvelle`
**Dossier :** `src/pages/CreateClasse/`
**Fichier principal :** `CreateClasse.tsx`

---

## Rôle

Formulaire de création d'une nouvelle classe avec sélection de niveau, salle, et type de salle.

---

## Données de formulaire initiales

```typescript
// readApi.createClasseData() → GET /read/create-classe
interface CreateClasseFormData {
  salles: Salle[]
  niveaux: string[]         // noms des niveaux disponibles
  annee_active: string      // label de l'année active (ex: "2024-2025")
}
```

---

## Champs du formulaire

| Champ | Type | Obligatoire | Notes |
|-------|------|-------------|-------|
| `nom` | text | oui | ex: "6ème A" |
| `niveau` | select | oui | options depuis niveaux[] |
| `capacite` | number | oui | min: 1 |
| `salle_type` | radio | oui | 'fixe' ou 'variable' |
| `salle` | select | si salle_type=fixe | options depuis salles[] |
| `annee_scolaire` | readonly | — | rempli auto avec annee_active |

---

## Logique salle_type

- Si `salle_type = 'variable'` → le champ `salle` est masqué et envoyé vide
- Si `salle_type = 'fixe'` → le champ `salle` est visible et obligatoire

---

## Soumission

```typescript
// ClasseContext.create(data)
// POST /classes
// { nom, niveau, annee_scolaire, capacite, salle, salle_type }
```

Après succès → navigation vers `/classes`

---

## Structure UI

```
PageHeader "Nouvelle classe"
  └─ Breadcrumb: Classes > Nouvelle classe

Card formulaire
  ├─ FormGrid
  │   ├─ Input nom
  │   ├─ Select niveau
  │   ├─ Input capacite (number)
  │   ├─ Radio salle_type
  │   └─ Select salle (conditionnel)
  └─ Boutons: Annuler | Créer la classe
```

---

## Dépendances

- `src/contexts/ClasseContext.tsx` → `useClasse()`
- `src/services/readApi.ts` → `createClasseData()`
- `src/components/shared/Input.tsx`
- `src/components/shared/Select.tsx`
- `src/components/shared/FormGrid.tsx`
- `src/components/shared/Button.tsx`
- `src/components/ui/PageHeader.tsx`
