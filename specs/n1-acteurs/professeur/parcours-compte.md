<a id="PA-PRF-001"></a>
# PA-PRF-001 — Recevoir ses identifiants et se connecter

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Professeur](_index.md)
> **Domaine fonctionnel** : Authentification & Comptes
> ⚠️ **Statut : Proposé (non implémenté).**

---

## Références

| Type | Lien |
|------|------|
| BC Authentification & Comptes | [bc-auth/_index.md](../../n2a-domaine/bc-auth/_index.md) |
| BC Professeurs | [bc-professeurs/_index.md](../../n2a-domaine/bc-professeurs/_index.md) |
| Pages IHM | [n2b-ihm/auth/_index.md](../../n2b-ihm/auth/_index.md) · [n2b-ihm/professeurs/_index.md](../../n2b-ihm/professeurs/_index.md) |

---

## Objectif

Permettre à un professeur de récupérer ses identifiants de connexion (créés par l'administration en même temps que sa fiche) et de se connecter pour la première fois.

---

## Pré-conditions

- L'administrateur / la direction a créé la fiche professeur **avec une adresse email valide** (l'email devient requis pour les professeurs).
- Le serveur dispose d'une configuration SMTP fonctionnelle.

---

## Parcours 1 — Création du compte par l'administration (déclencheur)

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | L'admin/direction crée une fiche professeur (nom, prénom, **email requis**, mot de passe saisi ou auto-généré) | UC-PRF-001 · UC-AUT-009 *(proposé)* | [PAGE-PRO-003](../../n2b-ihm/professeurs/page-creer-professeur.md) |
| 2 | Le système crée la fiche `Professeur` **et** le compte `User` lié (`role = professeur`, `professeur_id`) | UC-AUT-009 *(proposé)* | — |
| 3 | Un email contenant **l'identifiant + le mot de passe** est envoyé à l'adresse du professeur | UC-AUT-010 *(proposé)* | — |
| 4 | Confirmation à l'écran : « Compte créé, identifiants envoyés à \<email\> » | — | — |

## Parcours 2 — Première connexion du professeur

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Le professeur ouvre l'email et récupère son identifiant + mot de passe | — | — |
| 2 | Il ouvre l'application → écran de connexion | — | [PAGE-AUT-001](../../n2b-ihm/auth/page-connexion.md) |
| 3 | Il saisit ses identifiants → Se connecter | UC-AUT-001 | — |
| 4 | Le système exige le **changement du mot de passe** (flag `mustChangePassword`) | UC-AUT-003 | — |
| 5 | Il définit un nouveau mot de passe → accès accordé, redirection vers le tableau de bord (périmètre = ses classes) | UC-AUT-003 | — |

## Parcours 3 — Changer son mot de passe plus tard

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Paramètres → changer son mot de passe (actuel + nouveau) | UC-AUT-003 | [PAGE-PAR-001](../../n2b-ihm/parametres/page-parametres.md) |

---

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Email du professeur manquant à la création | Création bloquée (email requis pour un professeur) ou compte créé sans envoi + mot de passe affiché à l'admin |
| Échec de l'envoi de l'email (SMTP indisponible) | Le compte **est créé quand même** ; l'admin voit un avertissement, le mot de passe est affiché à l'écran et un bouton « renvoyer l'email » est proposé |
| SMTP non configuré sur le serveur | Pas d'envoi, pas de crash : bascule automatique sur l'affichage du mot de passe à l'admin |
| Identifiant ou mot de passe incorrect | Message générique « Identifiants invalides » |
| Compte professeur désactivé (fiche passée `inactif`) | Connexion refusée (statut fiche ↔ `actif` du compte synchronisés) |
