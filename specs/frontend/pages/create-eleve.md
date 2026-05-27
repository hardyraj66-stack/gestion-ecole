# Page CreateEleve

**Route :** `/eleves/nouveau`
**Dossier :** `src/pages/CreateEleve/`
**Fichier principal :** `CreateEleve.tsx`

---

## Rôle

Formulaire multi-sections pour créer un nouvel élève : informations personnelles, informations famille (père, mère, tuteur), et classe d'affectation.

---

## Données de formulaire initiales

```typescript
// readApi.createEleveData() → GET /read/create-eleve
interface CreateEleveFormData {
  classes: Array<{ id: string; nom: string; niveau: string }>
  annee_active: string
}
```

---

## Sections du formulaire

### Section 1 : Informations personnelles
| Champ | Type | Obligatoire |
|-------|------|-------------|
| `nom` | text | oui |
| `prenom` | text | oui |
| `date_naissance` | date | oui |
| `genre` | radio (M/F) | oui |
| `classe_id` | select | oui |
| `email` | email | non |
| `telephone` | text | non |
| `adresse` | textarea | non |

### Section 2 : Père (optionnel)
| Champ | Type |
|-------|------|
| `pere.nom` | text |
| `pere.prenom` | text |
| `pere.telephone` | text |
| `pere.email` | email |
| `pere.statut` | select (vivant/decede) |

### Section 3 : Mère (optionnel)
Même structure que père.

### Section 4 : Tuteur (optionnel — si ni père ni mère)
| Champ | Type |
|-------|------|
| `tuteur.nom` | text |
| `tuteur.prenom` | text |
| `tuteur.telephone` | text |
| `tuteur.email` | email |
| `tuteur.lien` | text (ex: "oncle") |

---

## Soumission

```typescript
// EleveContext.create(data)
// POST /eleves
```

Après succès → navigation vers `/eleves/:id` (fiche du nouvel élève)

---

## Structure UI

```
PageHeader "Nouvel élève"

Tabs ou accordéon:
  ├─ Identité
  ├─ Famille (père / mère / tuteur — toggle selon présence)
  └─ Affectation (classe)

Boutons: Annuler | Enregistrer l'élève
```

---

## Dépendances

- `src/contexts/EleveContext.tsx`
- `src/services/readApi.ts` → `createEleveData()`
- `src/components/shared/Input.tsx`
- `src/components/shared/Select.tsx`
- `src/components/shared/Textarea.tsx`
- `src/components/shared/FormGrid.tsx`
- `src/components/shared/Button.tsx`
