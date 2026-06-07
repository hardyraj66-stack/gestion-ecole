> **Couche** : N1 — QUI (acteurs, rôles, parcours)
> **Ce fichier contient** : identité, rôle, plateforme d'accès, parcours par domaine
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails d'écrans (→ N2b), détails techniques (→ N3)

# Acteur — Administrateur

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Nom | Administrateur système |
| Rôle technique | `admin` |
| Accès | Application web complète + gestion des comptes |
| Authentification | Obligatoire (compte + mot de passe, JWT) |
| Application | Front web React, desktop |

---

## Description

L'administrateur dispose de tous les droits de l'application (y compris ceux de la Direction et du Secrétariat) et, en plus, gère les **comptes utilisateurs** : création des comptes, attribution des rôles (`admin`, `professeur`, `secretaire`), activation/désactivation et réinitialisation des mots de passe. C'est le seul acteur autorisé à accéder à la page `/utilisateurs`.

Au premier démarrage de l'application, un compte administrateur par défaut est créé automatiquement (`admin` / `admin123`) ; il doit être sécurisé dès la première connexion.

---

## Parcours par domaine

### Gestion des comptes
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-ADM-001 | [Gérer les comptes utilisateurs](parcours-comptes.md) | Créer des comptes, attribuer les rôles, désactiver, réinitialiser les mots de passe | Rédigé |

### Reste de l'application
L'administrateur peut effectuer l'ensemble des parcours de la [Direction](../direction/_index.md) et du [Secrétariat](../secretariat/_index.md).
