# Page EleveFiche

**Route :** `/eleves/:id`
**Dossier :** `src/pages/EleveFiche/`
**Fichier principal :** `EleveFiche.tsx`

---

## Rôle

Fiche détaillée d'un élève avec onglets pour les informations personnelles, la famille, l'assiduité, les avertissements, et la gestion du statut.

---

## Composants du dossier

| Fichier | Rôle |
|---------|------|
| `EleveFiche.tsx` | Page principale, onglets, chargement |
| `FicheIdentite.tsx` | Onglet: infos personnelles + bouton édition |
| `FicheFamille.tsx` | Onglet: père, mère, tuteur |
| `FicheAssiduité.tsx` | Onglet: absences et retards |
| `FicheAvertissements.tsx` | Onglet: avertissements et convocations |
| `FicheStatut.tsx` | Onglet: statut de l'élève (actif/exclu/parti) |
| `FicheShortcuts.tsx` | Actions rapides en en-tête |

---

## Paramètres de route

```typescript
const { id } = useParams()  // id de l'élève
```

---

## Données requises

```typescript
// Hook: useEleveFicheData(eleveId)
// Endpoint: GET /read/eleves/:id/fiche?anneeLabel=?

interface EleveFicheData {
  eleve: Eleve & {
    classe_nom: string; classe_niveau: string
  }
  absences: Absence[]
  avertissements: Avertissement[]
  convocations: Convocation[]
  historique_classes: Array<{
    annee_scolaire: string; classe_nom: string; statut: EleveStatut
  }>
  exclusion?: EleveExclu
  depart?: EleveQuitte
}
```

---

## Structure UI

```
PageHeader "[Prénom Nom]"
  ├─ Breadcrumb: Élèves > [Prénom Nom]
  ├─ Badge statut (actif/exclu/parti)
  └─ FicheShortcuts: "Bulletin" → /eleves/:id/bulletin

Onglets:
  ├─ Identité        → FicheIdentite
  ├─ Famille         → FicheFamille
  ├─ Assiduité       → FicheAssiduité
  ├─ Avertissements  → FicheAvertissements
  └─ Statut          → FicheStatut
```

---

## FicheIdentite

- Affiche : nom, prénom, date naissance, genre, email, téléphone, adresse, classe actuelle
- Bouton "Modifier" → ouvre modal d'édition inline
- En mode archive : bouton masqué

---

## FicheFamille

- Affiche les informations du père, mère, tuteur (si présents)
- Statut "décédé" affiché avec style discret

---

## FicheAssiduité

- Tableau des absences : date, type (absence/retard), durée, justifiée, motif
- Compteurs : total absences, total retards, total justifiées
- Bouton "Ajouter une absence" (mode live uniquement)
- POST /suivi/absences — modal formulaire

---

## FicheAvertissements

- Liste des avertissements : date, type, motif, commentaire
- Liste des convocations : date, raison, statut effectuée
- Bouton "Ajouter avertissement" → POST /suivi/avertissements
- Bouton "Ajouter convocation" → POST /suivi/convocations (auto-générée après 3 avertissements)

---

## FicheStatut

Gestion du changement de statut de l'élève :

**Si actif :**
- Bouton "Exclure l'élève" → modal avec raison, commentaire → `EleveContext.setStatut(id, 'exclu', {...})`
- Bouton "Élève parti" → modal avec motif, raison, date départ → `EleveContext.setStatut(id, 'parti', {...})`

**Si exclu :**
- Affiche les détails de l'exclusion
- Bouton "Réintégrer" → `EleveContext.setStatut(id, 'actif')`

**Si parti :**
- Affiche les détails du départ (motif, date, raison)

---

## Dépendances

- `src/hooks/usePageData.ts` → `useEleveFicheData`
- `src/contexts/EleveContext.tsx`
- `src/components/shared/Badge.tsx`
- `src/components/shared/Modal.tsx`
- `src/components/shared/ConfirmDialog.tsx`
- `src/components/shared/AuditEntry.tsx`
