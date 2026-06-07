> **Couche** : N1 — QUI (acteurs, rôles, parcours)
> **Ce fichier contient** : identité, rôle, plateforme d'accès, parcours par domaine
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails d'écrans (→ N2b), détails techniques (→ N3)

# Acteur — Secrétariat

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Nom | Secrétariat / Agent administratif |
| Rôle technique | `secretaire` |
| Accès | Application web complète |
| Authentification | Obligatoire (compte + mot de passe, JWT) |
| Application | Front web React, desktop |

---

## Description

L'agent du secrétariat est l'utilisateur principal de l'application au quotidien. Il gère les inscriptions des élèves, la saisie des notes et des absences, la configuration du planning, et le suivi disciplinaire. Il a accès à toutes les fonctions de saisie et de consultation de l'application.

---

## Parcours par domaine

### Classes
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-SEC-001 | [Gérer les classes](parcours-classes.md) | Consulter, créer et gérer les classes de l'établissement | Rédigé |

### Élèves
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-SEC-002 | [Gérer les élèves](parcours-eleves.md) | Inscrire, consulter et gérer les dossiers élèves | Rédigé |

### Notes
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-SEC-003 | [Saisir les notes](parcours-notes.md) | Saisir, modifier et annuler les notes par classe/matière/trimestre | Rédigé |

### Planning
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-SEC-004 | [Gérer le planning](parcours-planning.md) | Créer, modifier et supprimer les créneaux hebdomadaires | Rédigé |

### Suivi élève
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-SEC-005 | [Suivre l'assiduité et le comportement](parcours-suivi.md) | Saisir les absences, avertissements et convocations | Rédigé |

### Évaluations
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-SEC-006 | [Gérer les évaluations](parcours-evaluations.md) | Créer des évaluations, saisir les notes, publier | Rédigé |
