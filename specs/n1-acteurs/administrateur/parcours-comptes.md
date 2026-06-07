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
| 2 | "Nouveau compte" → saisir identifiant, mot de passe, nom, rôle | UC-AUT-005 | — |
| 3 | Valider → compte créé, visible dans la liste | UC-AUT-005 | — |

## Parcours 3 — Modifier un compte ou son rôle

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des utilisateurs → "Modifier" sur une ligne | UC-AUT-006 | [PAGE-AUT-002](../../n2b-ihm/auth/page-utilisateurs.md) |
| 2 | Changer le nom, le rôle ou activer/désactiver le compte → Enregistrer | UC-AUT-006 | — |

## Parcours 4 — Réinitialiser un mot de passe

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Depuis la liste des utilisateurs → "Réinitialiser le mot de passe" | UC-AUT-007 | — |
| 2 | Saisir le nouveau mot de passe → Valider | UC-AUT-007 | — |

## Parcours 5 — Changer son propre mot de passe

| # | Étape | Ref. UC | Ref. page |
|---|-------|---------|-----------|
| 1 | Changer son mot de passe (mot de passe actuel + nouveau) | UC-AUT-003 | — |

## Cas d'erreur

| Situation | Comportement |
|-----------|-------------|
| Identifiant ou mot de passe incorrect | Message générique « Identifiants invalides » (n'indique pas si le compte existe) |
| Compte désactivé qui tente de se connecter | Connexion refusée (« Identifiants invalides ») |
| Identifiant déjà utilisé à la création | Erreur « Cet identifiant existe déjà » |
| Mot de passe trop court (< 4 caractères) | Erreur de validation |
| Désactivation / suppression / changement de rôle du dernier admin actif | Action bloquée : « il doit rester au moins un administrateur actif » |
| Jeton expiré (12 h) ou invalide | Déconnexion automatique, retour à l'écran de connexion |
