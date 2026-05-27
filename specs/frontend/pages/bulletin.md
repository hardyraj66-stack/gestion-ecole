# Page Bulletin

**Route :** `/eleves/:id/bulletin`
**Dossier :** `src/pages/Bulletin/`
**Fichier principal :** `Bulletin.tsx`

---

## Rôle

Affiche le bulletin de notes d'un élève pour un trimestre sélectionné. Résume les matières avec DS, Évaluation, Moyenne, Coefficient, et la moyenne générale.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `Bulletin.tsx` | Page principale, sélection trimestre, loading |
| `StudentCard.tsx` | Carte d'identité de l'élève (nom, classe, année) |
| `GradesTable.tsx` | Tableau des matières avec notes |
| `TrimestreTabs.tsx` | Onglets T1 / T2 / T3 |

---

## Paramètres de route

```typescript
const { id } = useParams()  // eleveId
```

---

## Données requises

```typescript
// Hook: useBulletinData(eleveId, trimestre)
// Endpoint: GET /read/bulletin/:eleveId?trimestre=N&anneeLabel=?

interface BulletinData {
  eleve: {
    id: string; nom: string; prenom: string
    date_naissance: string; classe_nom: string
    classe_niveau: string; annee_scolaire: string
  }
  trimestre: Trimestre
  matieres: BulletinMatiere[]    // une ligne par matière
  moyenne_generale: number | null
  rang?: number
  nb_eleves_classe?: number
}

interface BulletinMatiere {
  matiere_id: string
  matiere_nom: string
  code: string
  coefficient: number
  ds: number | null           // note DS (null si non saisi)
  evaluation: number | null   // note évaluation (null si non saisi)
  moyenne: number             // (ds + evaluation) / 2
}
```

---

## Structure UI

```
PageHeader "[Prénom Nom] — Bulletin"
  └─ Breadcrumb: Élèves > [Nom] > Bulletin

StudentCard
  ├─ Nom complet
  ├─ Classe + Niveau
  └─ Année scolaire

TrimestreTabs (T1 / T2 / T3)

GradesTable
  ├─ Colonnes: Matière, Code, Coeff, DS, Évaluation, Moyenne
  ├─ Ligne par matière
  └─ Pied de tableau: Moyenne générale

Bouton d'export PDF (si non archive)
```

---

## GradesTable

- Chaque ligne : matière_nom, code, coefficient, ds (ou `—`), evaluation (ou `—`), moyenne
- Couleur de la moyenne selon valeur : rouge < 10, orange 10-12, vert > 12
- Pied : moyenne générale pondérée (somme des moyennes × coeff / somme des coeff)
- Si `moyenne_generale = null` : "Aucune note saisie"

---

## TrimestreTabs

- Onglets : Trimestre 1 | Trimestre 2 | Trimestre 3
- Changer d'onglet → `setTrimestre(n)` → re-fetch via `useBulletinData`

---

## État local

```typescript
const [trimestre, setTrimestre] = useState<Trimestre>(1)
```

---

## Dépendances

- `src/hooks/usePageData.ts` → `useBulletinData`
- `src/utils/helpers.ts` → `getNoteColor`, `getMention`
- `src/components/ui/PageHeader.tsx`
- `src/components/shared/Table.tsx`
