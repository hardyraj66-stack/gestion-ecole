# Module Seeder

**Dossier source :** `server/src/data/`

---

## Rôle

Génère des données initiales réalistes pour l'application. S'exécute automatiquement au premier démarrage si toutes les collections sont vides.

---

## Déclenchement

```typescript
// SeederService.onModuleInit()
// Vérifie si la collection 'classes' est vide
// Si oui → lance seed()
// Si non → skip
```

Peut aussi être lancé manuellement :
```bash
cd server && npm run seed
```

---

## Données générées

| Entité | Quantité | Détails |
|--------|----------|---------|
| Salles | 12 | Types variés (standard, labo, info, sport) |
| Niveaux | 7 | 6ème → Terminale, avec ordre et matières |
| Matières | 15 | Avec coefficients par niveau, couleurs |
| Classes | 15 | 2-3 classes par niveau |
| Élèves | ~350 | Distribués dans les classes, noms français aléatoires |
| Notes | ~2 000 | Réparties sur 3 trimestres |
| Créneaux | ~200 | Planning hebdomadaire par classe |
| Professeurs | ~20 | Avec affectations classe/matière |
| Périodes | 6 | 3 trimestres × (DS + Évaluation) |
| Année scolaire | 1 | Statut "active" |

---

## Algorithme de génération

1. Créer l'année scolaire active (ex: "2024-2025")
2. Créer les niveaux dans l'ordre (6ème → Terminale)
3. Créer les matières avec coefficients par niveau
4. Créer les salles
5. Créer les classes (2-3 par niveau, salle fixe ou variable)
6. Créer les professeurs
7. Créer les affectations (prof → classe/matière)
8. Créer les élèves (20-25 par classe, noms/prénoms depuis liste prédéfinie)
9. Créer les notes (DS + Évaluation par matière par trimestre, valeurs réalistes)
10. Créer les créneaux de planning (lundi-vendredi, 8h-17h)
11. Créer les périodes d'évaluation avec dates

---

## Fichiers annexes

```
server/src/data/migration-professeurs.ts   ← migration one-shot pour ajouter les profs
server/src/data/reset-and-seed.js          ← script Node.js pour vider la DB et re-seeder
server/src/data/seed-full.js               ← script de seed complet standalone
```

### reset-and-seed.js

Utilitaire de développement pour repartir d'une DB propre :
```bash
node server/src/data/reset-and-seed.js
```

1. Se connecte à MongoDB
2. Vide toutes les collections
3. Relance le seeder

---

## Noms générés

Les noms et prénoms sont issus de listes prédéfinies de prénoms et noms français/malgaches réalistes. Le générateur utilise une graine déterministe pour produire les mêmes données à chaque seed.
