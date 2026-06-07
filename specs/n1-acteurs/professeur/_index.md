> **Couche** : N1 — QUI (acteurs, rôles, parcours)
> **Ce fichier contient** : identité, rôle, plateforme d'accès, matrice d'accès, parcours par domaine
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails d'écrans (→ N2b), détails techniques (→ N3)

# Acteur — Professeur

> ⚠️ **Statut : Proposé (cible, non encore implémenté).** Le rôle technique `professeur` existe déjà dans l'authentification, mais le code n'applique **aucun cloisonnement** par professeur aujourd'hui (seule la restriction `admin` sur `/users` est codée). Ce document décrit le comportement **cible** ; voir le plan de réalisation en 2 phases en bas de page.

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Nom | Professeur / Enseignant |
| Rôle technique | `professeur` |
| Accès | Application web, **périmètre restreint à ses classes** |
| Authentification | Obligatoire (compte + mot de passe, JWT) |
| Création du compte | Créé en même temps que la fiche professeur ; identifiants envoyés par email |
| Application | Front web React, desktop |

---

## Description

Le professeur consulte les données de **ses classes** (celles où il a au moins une affectation) et saisit les **notes et évaluations de ses matières**. Il n'a aucun accès à la configuration de l'établissement (niveaux, matières, salles, professeurs), au cycle des années scolaires, ni à la gestion des comptes.

Contrairement aux autres acteurs, le compte de connexion d'un professeur est **lié à sa fiche** (`User.professeur_id` → `Professeur`) : créer un professeur crée aussi son compte, et ses identifiants (identifiant + mot de passe) lui sont **envoyés par email**. À la première connexion, il lui est demandé de changer son mot de passe.

---

## Périmètre — « ses classes »

Le périmètre d'un professeur est **dérivé de ses affectations** (`TeacherAssignment` : couples `classe ↔ matière`), à deux niveaux :

| Niveau | Dérivé de | Donne droit à |
|--------|-----------|---------------|
| **Classes** (≥1 affectation) | projection de ses couples | **Lecture** : voir ces classes, leurs élèves, leur planning, leurs bulletins |
| **Couples (classe, matière)** | ses affectations exactes | **Écriture** : saisir / modifier les notes et évaluations de ces couples uniquement |

> Le filtrage est appliqué **côté serveur** (le périmètre est dérivé du `professeur_id` porté par le JWT, puis appliqué dans le `ReadService` et les écritures). Masquer les liens dans la barre latérale n'est qu'un confort visuel et ne suffit pas.

---

## Matrice d'accès aux pages

| Page (route) | Accès professeur |
|--------------|:----------------:|
| Tableau de bord `/dashboard` | 👁️ version réduite (ses classes / élèves) |
| Classes `/classes`, `/classes/:id/eleves` | 👁️ **filtré à ses classes** |
| Élèves `/eleves`, fiche `/eleves/:id` | 👁️ **élèves de ses classes** |
| Bulletin `/eleves/:id/bulletin` | 👁️ lecture seule, complet, ses élèves |
| Notes `/notes` | ✅ saisie **limitée à ses (classe, matière)** |
| Évaluations `/evaluations…` | ✅ saisie **limitée à ses (classe, matière)** |
| Planning `/planning`, `/classes/:id/planning` | 👁️ ses créneaux / ses classes |
| Matières `/matieres…` | ❌ |
| Niveaux `/niveaux…` | ❌ |
| Salles `/salles…` | ❌ |
| Professeurs `/professeurs…` | ❌ |
| Année scolaire / archives `/annee-scolaire` | ❌ |
| Utilisateurs `/utilisateurs` | ❌ |
| Paramètres `/parametres` | ✅ (préférences perso + changer son mot de passe) |

Légende : ✅ accès complet · 👁️ lecture seule (filtrée) · ❌ interdit (route renvoie `403` côté serveur, lien masqué côté front).

---

## Parcours par domaine

### Compte & connexion
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-PRF-001 | [Recevoir ses identifiants et se connecter](parcours-compte.md) | Réception de l'email, première connexion, changement de mot de passe | Proposé |

### Consultation
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-PRF-002 | [Consulter ses classes et ses élèves](parcours-consultation.md) | Voir ses classes, les élèves, le planning et les bulletins (lecture seule) | Proposé |

### Saisie pédagogique
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-PRF-003 | [Saisir notes et évaluations](parcours-notes-evaluations.md) | Saisir les notes et gérer les évaluations de ses matières | Proposé |

---

## Plan de réalisation (2 phases)

1. **Phase 1 — Accès + verrouillage de la configuration.** Le professeur se connecte ; les modules de configuration (Niveaux, Matières, Salles, Professeurs, Année scolaire, Utilisateurs) sont masqués et renvoient `403` via `@Roles`. À ce stade il voit encore toutes les classes en lecture, mais ne peut rien modifier hors de son domaine.
2. **Phase 2 — Cloisonnement des données.** `professeur_id` ajouté au JWT, périmètre dérivé de `TeacherAssignment`, filtrage des vues `/read/*` et bridage des écritures notes/évaluations aux couples autorisés.

---

## Références

| Type | Lien |
|------|------|
| BC Authentification & Comptes | [bc-auth/_index.md](../../n2a-domaine/bc-auth/_index.md) |
| BC Professeurs | [bc-professeurs/_index.md](../../n2a-domaine/bc-professeurs/_index.md) |
| Acteur Administrateur (gère les comptes) | [administrateur/_index.md](../administrateur/_index.md) |
