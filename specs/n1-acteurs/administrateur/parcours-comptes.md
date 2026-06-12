<a id="PA-ADM-001"></a>
# PA-ADM-001 — Gérer les comptes utilisateurs

> **Couche** : N1 — Parcours acteur
> **Acteur** : [Administrateur](_index.md)
> **Domaine fonctionnel** : Authentification & Comptes

---

## Références

| Type | Lien |
|------|------|
| BC Authentification & Comptes | [bc-auth/_index.md](../../n2a-domaine/bc-auth/_index.md) |
| Pages IHM | [n2b-ihm/auth/_index.md](../../n2b-ihm/auth/_index.md) |

---

## Parcours 1 — Se connecter

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Ouvrir l'application → écran de connexion | — | [PAGE-AUT-001](../../n2b-ihm/auth/page-connexion.md) |
| 2 | Saisir l'identifiant et le mot de passe → Se connecter | UC-AUT-001 | — |
| 3 | Accès accordé → redirection vers le tableau de bord | UC-AUT-001 | — |

## Parcours 2 — Créer un compte utilisateur

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Menu latéral → "Utilisateurs" (visible uniquement pour les admin) | — | [PAGE-AUT-002](../../n2b-ihm/auth/page-utilisateurs.md) |
| 2 | "Nouveau compte" → saisir email (requis), nom, rôle ; le mot de passe est généré | UC-AUT-013 | — |
| 3 | Valider → compte créé, identifiants **envoyés par email** (1ʳᵉ connexion forcée) | UC-AUT-013 | — |

## Parcours 3 — Modifier un compte ou son rôle

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des utilisateurs → "Modifier" sur une ligne | UC-AUT-014 | [PAGE-AUT-002](../../n2b-ihm/auth/page-utilisateurs.md) |
| 2 | Changer le nom, l'email, le rôle ou activer/désactiver le compte → Enregistrer | UC-AUT-014 | — |

## Parcours 4 — Réinitialiser un mot de passe

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des utilisateurs → "Réinitialiser le mot de passe" | UC-AUT-015 | — |
| 2 | Laisser vide (généré) ou saisir le nouveau mot de passe → Valider ; identifiants renvoyés par email si le compte en a un | UC-AUT-015 | — |

## Parcours 5 — Archiver / restaurer un compte

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste → "Supprimer" → le compte est **archivé** (soft-delete), pas effacé | UC-AUT-017 | [PAGE-AUT-002](../../n2b-ihm/auth/page-utilisateurs.md) |
| 2 | "Voir les archives" → "Restaurer" sur une ligne → compte réactivé | UC-AUT-012 / UC-AUT-016 | — |

## Parcours 6 — Changer son propre mot de passe / gérer ses sessions

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Changer son mot de passe (mot de passe actuel + nouveau) | UC-AUT-004 | — |
| 2 | Lister / révoquer ses sessions, ou « déconnecter toutes les sessions » | UC-AUT-006 / UC-AUT-007 / UC-AUT-008 | — |

## Parcours 7 — Mot de passe oublié (self-service, tout acteur)

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Écran de connexion → "Mot de passe oublié ?" → saisir l'email | UC-AUT-009 | [PAGE-AUT-001](../../n2b-ihm/auth/page-connexion.md) |
| 2 | Réception d'un email avec lien → définir un nouveau mot de passe → connexion | UC-AUT-010 | — |

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Identifiant ou mot de passe incorrect | Message générique « Identifiants invalides » (n'indique pas si le compte existe) |
| Compte désactivé ou archivé qui tente de se connecter | Connexion refusée (« Identifiants invalides ») |
| Trop de tentatives (5 échecs) | Blocage temporaire 15 min (message générique) |
| Identifiant ou email déjà utilisé à la création | Erreur « Cet identifiant existe déjà » / lien vers la fiche du professeur existant |
| Mot de passe non conforme (< 8 caractères, ou sans lettre + chiffre) | Erreur de validation |
| Désactivation / suppression / changement de rôle du dernier admin actif | Action bloquée : « il doit rester au moins un administrateur actif » |
| Jeton expiré (12 h), invalide ou **révoqué** (mot de passe changé, compte désactivé) | Déconnexion automatique, retour à l'écran de connexion |
