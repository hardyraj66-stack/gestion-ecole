# Routing Frontend

**Fichier source :** `src/App.tsx`

L'application est une SPA React Router v7. Toutes les routes sont imbriquées sous le composant `Layout` qui fournit la barre latérale et la zone de contenu.

---

## Table des routes

| Path | Composant | Description |
|------|-----------|-------------|
| `/` | redirect → `/dashboard` | Redirection racine |
| `/dashboard` | `Dashboard` | Tableau de bord |
| `/classes` | `ClassesList` | Liste des classes |
| `/classes/nouvelle` | `CreateClasse` | Formulaire création classe |
| `/classes/:id/eleves` | `ClasseEleves` | Élèves d'une classe |
| `/classes/:id/planning` | `Planning` | Planning d'une classe |
| `/eleves` | `ElevesList` | Liste des élèves |
| `/eleves/nouveau` | `CreateEleve` | Formulaire création élève |
| `/eleves/:id` | `EleveFiche` | Fiche détail élève |
| `/eleves/:id/bulletin` | `Bulletin` | Bulletin de notes |
| `/matieres` | `MatieresList` | Liste des matières |
| `/matieres/nouvelle` | `CreateMatiere` | Formulaire création matière |
| `/notes` | `AjouterNotes` | Saisie des notes |
| `/planning` | `Planning` | Planning global (sélecteur de classe) |
| `/salles` | `SallesList` | Liste des salles |
| `/salles/nouvelle` | `CreateSalle` | Formulaire création salle |
| `/niveaux` | `NiveauxList` | Liste des niveaux scolaires |
| `/niveaux/nouveau` | `CreateNiveau` | Formulaire création niveau |
| `/professeurs` | `ProfesseursList` | Liste des professeurs |
| `/professeurs/affectations` | `ProfesseurAssignments` | Gestion des affectations |
| `/professeurs/:id` | `ProfesseurDetail` | Fiche détail professeur |
| `/annee-scolaire` | `AnneeScolairePage` | Gestion année scolaire |
| `/evaluations` | `PeriodesList` | Périodes d'évaluation |
| `/evaluations/liste` | `EvaluationsList` | Liste des évaluations |
| `/evaluations/nouvelle` | `CreateEvaluation` | Créer une évaluation |
| `/evaluations/:id` | `EvaluationDetail` | Détail / saisie notes évaluation |
| `/parametres` | `Parametres` | Paramètres (thème, langue) |
| `/*` | redirect → `/dashboard` | Fallback |

---

## Structure du routing

```tsx
<BrowserRouter>
  <AppProviders>          // tous les contextes
    <Routes>
      <Route path="/" element={<Layout />}>   // layout commun
        <Route index element={<Navigate to="/dashboard" replace />} />
        // ... toutes les routes enfants
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  </AppProviders>
</BrowserRouter>
```

## Notes importantes

- Le composant `Layout` contient le `<Outlet />` où les pages s'affichent
- `AppProviders` englobe tout — les contextes sont disponibles dans toutes les pages
- La route `/classes/:id/planning` et `/planning` pointent sur le même composant `Planning` ; il détecte la présence du paramètre `id` pour pré-sélectionner la classe
