# GestionÉcole — Spécifications fonctionnelles et techniques

> Version : 1.0 | Date : 2026-05-27 | Statut : Complet
> Point d'entrée principal — à lire en premier

---

## Vision

GestionÉcole est une application de gestion scolaire full-stack (React + NestJS + MongoDB). Elle couvre le cycle complet d'un établissement : configuration des niveaux et matières, gestion des classes et élèves, saisie des notes, planning hebdomadaire, suivi des présences et des comportements, gestion des évaluations formelles et des années scolaires archivées.

---

## Structure des spécifications

Les specs sont organisées en 4 niveaux orthogonaux :

| Niveau | Question | Contenu |
|--------|----------|---------|
| **N1** | QUI | Acteurs, rôles, parcours utilisateur |
| **N2a** | QUOI (métier) | Bounded Contexts, règles, use cases, API |
| **N2b** | QUOI (écrans) | Pages IHM, colonnes, actions, formulaires |
| **N3** | COMMENT | Architecture, patterns, infra, composants |

---

## N1 — Acteurs

| # | Acteur | Rôle | Fiche |
|---|--------|------|-------|
| 1 | Secrétariat | Saisie quotidienne : élèves, notes, absences, planning | [n1-acteurs/secretariat/](n1-acteurs/secretariat/_index.md) |
| 2 | Direction | Consultation, archives, configuration de l'établissement | [n1-acteurs/direction/](n1-acteurs/direction/_index.md) |

---

## N2a — Bounded Contexts (domaine métier)

| # | BC | Code | Rôle | Spec |
|---|----|------|------|------|
| 1 | **Classes** | CLS | Cycle de vie des classes (création, désactivation, salle) | [bc-classes/](n2a-domaine/bc-classes/_index.md) |
| 2 | **Élèves** | ELV | Inscription, fiche, statut, suivi | [bc-eleves/](n2a-domaine/bc-eleves/_index.md) |
| 3 | **Notes** | NOT | Saisie, bulletin, moyennes | [bc-notes/](n2a-domaine/bc-notes/_index.md) |
| 4 | **Planning** | PLN | Créneaux hebdomadaires, conflits de salle | [bc-planning/](n2a-domaine/bc-planning/_index.md) |
| 5 | **Salles** | SAL | Référentiel salles, disponibilité | [bc-salles/](n2a-domaine/bc-salles/_index.md) |
| 6 | **Matières** | MAT | Référentiel matières, coefficients par niveau | [bc-matieres/](n2a-domaine/bc-matieres/_index.md) |
| 7 | **Années scolaires** | ANN | Cycle préparation → active → terminée, archives | [bc-annees/](n2a-domaine/bc-annees/_index.md) |
| 8 | **Évaluations** | EVA | DS / contrôles structurés, publication vers notes | [bc-evaluations/](n2a-domaine/bc-evaluations/_index.md) |
| 9 | **Professeurs** | PRF | Référentiel profs, affectations classe/matière | [bc-professeurs/](n2a-domaine/bc-professeurs/_index.md) |
| 10 | **Niveaux** | NIV | Niveaux scolaires, matières associées | [bc-niveaux/](n2a-domaine/bc-niveaux/_index.md) |
| 11 | **Suivi élève** | SUI | Absences, avertissements, convocations, exclusions, départs | [bc-suivi/](n2a-domaine/bc-suivi/_index.md) |

---

## N2b — Specs IHM (pages)

| Module | Pages | Index |
|--------|-------|-------|
| Dashboard | 1 page | [n2b-ihm/dashboard/](n2b-ihm/dashboard/_index.md) |
| Classes | Liste, détail élèves, créer | [n2b-ihm/classes/](n2b-ihm/classes/_index.md) |
| Élèves | Liste, fiche, créer, bulletin | [n2b-ihm/eleves/](n2b-ihm/eleves/_index.md) |
| Notes | Saisie | [n2b-ihm/notes/](n2b-ihm/notes/_index.md) |
| Planning | Grille hebdomadaire | [n2b-ihm/planning/](n2b-ihm/planning/_index.md) |
| Salles | Liste, détail, créer | [n2b-ihm/salles/](n2b-ihm/salles/_index.md) |
| Matières | Liste, créer | [n2b-ihm/matieres/](n2b-ihm/matieres/_index.md) |
| Niveaux | Liste, créer | [n2b-ihm/niveaux/](n2b-ihm/niveaux/_index.md) |
| Professeurs | Liste, fiche, affectations | [n2b-ihm/professeurs/](n2b-ihm/professeurs/_index.md) |
| Évaluations | Périodes, liste, créer, détail | [n2b-ihm/evaluations/](n2b-ihm/evaluations/_index.md) |
| Année scolaire | Cycle, archives | [n2b-ihm/annee-scolaire/](n2b-ihm/annee-scolaire/_index.md) |
| Paramètres | Thème, couleur, langue | [n2b-ihm/parametres/](n2b-ihm/parametres/_index.md) |

---

## N3 — Architecture et transverse

| Document | Description | Lien |
|----------|-------------|------|
| Architecture frontend | React, CQRS client, hooks, contextes, Socket.IO | [n3-comment/frontend/architecture/frontend.md](n3-comment/frontend/architecture/frontend.md) |
| Composants frontend | Catalogue shared/ et ui/ | [n3-comment/frontend/composants/composants.md](n3-comment/frontend/composants/composants.md) |
| Architecture backend | NestJS, modules, CQRS inspiré, MongoDB | [n3-comment/backend/architecture/backend.md](n3-comment/backend/architecture/backend.md) |
| Schémas MongoDB | Toutes les collections, index, contraintes | [n3-comment/backend/schemas/schemas.md](n3-comment/backend/schemas/schemas.md) |
| Module Read | ReadController, ReadService, ViewBuilder | [n3-comment/backend/read/read.md](n3-comment/backend/read/read.md) |

---

## Stack technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Frontend UI | React | 19.x |
| Bundler | Vite | 7.x |
| Routing | React Router | 7.x |
| CSS | Tailwind CSS | 4.x |
| Temps réel | Socket.IO client | 4.8.x |
| i18n | react-i18next | — |
| Build prod | vite-plugin-singlefile | — |
| Backend | NestJS | — |
| ODM | Mongoose | — |
| Base de données | MongoDB | localhost:27017/gestion-ecole |
| WebSocket | Socket.IO server | — |

---

## Système d'identifiants

| Préfixe | Portée | Exemple |
|---------|--------|---------|
| `PA-SEC-NNN` | Parcours acteur Secrétariat | `PA-SEC-001` |
| `PA-DIR-NNN` | Parcours acteur Direction | `PA-DIR-001` |
| `UC-CLS-NNN` | Use case BC Classes | `UC-CLS-001` |
| `UC-ELV-NNN` | Use case BC Élèves | `UC-ELV-001` |
| `UC-NOT-NNN` | Use case BC Notes | `UC-NOT-001` |
| `UC-PLN-NNN` | Use case BC Planning | `UC-PLN-001` |
| `UC-SAL-NNN` | Use case BC Salles | `UC-SAL-001` |
| `UC-MAT-NNN` | Use case BC Matières | `UC-MAT-001` |
| `UC-ANN-NNN` | Use case BC Années | `UC-ANN-001` |
| `UC-EVA-NNN` | Use case BC Évaluations | `UC-EVA-001` |
| `UC-PRF-NNN` | Use case BC Professeurs | `UC-PRF-001` |
| `UC-NIV-NNN` | Use case BC Niveaux | `UC-NIV-001` |
| `UC-SUI-NNN` | Use case BC Suivi | `UC-SUI-001` |
| `PAGE-NNN` | Page IHM | `PAGE-001` |

---

## Guide de lecture pour Claude Code

| Contexte | Fichiers à lire |
|----------|-----------------|
| Nouveau sur le projet | Ce fichier `_index.md` |
| Travailler sur un BC | `n2a-domaine/bc-<nom>/_index.md` → `use-cases.md` → `regles-api.md` |
| Comprendre une page | `n2b-ihm/<module>/_index.md` → page spécifique |
| Comprendre l'architecture | `n3-comment/frontend/architecture/frontend.md` ou `n3-comment/backend/architecture/backend.md` |
| Parcours utilisateur complet | `n1-acteurs/<acteur>/_index.md` → parcours par domaine |
