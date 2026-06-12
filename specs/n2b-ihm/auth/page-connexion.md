<a id="PAGE-AUT-001"></a>
# Connexion

> **Couche** : N2b — QUOI écrans (page : Connexion)
> **Acteur concerné** : tous
> **UC sous-jacents** : [UC-AUT-001](../../n2a-domaine/bc-auth/_index.md) (connexion), [UC-AUT-009 / UC-AUT-010](../../n2a-domaine/bc-auth/_index.md) (mot de passe oublié / réinitialisation)
> **Type de page** : Formulaire plein écran (hors Layout) — deux modes : `login` et `forgot`
> **Routes** : `/login` (publique) ; `/reinitialiser-mot-de-passe?token=…` (page publique de définition d'un nouveau mot de passe, `ResetPassword`)
> **Source de données** : `AuthContext.login(username, password)` → `POST /auth/login` ; `POST /auth/forgot-password` ; `POST /auth/reset-password`
> **Ce fichier contient** : champs, comportements, erreurs
> **Ce fichier NE contient PAS** : logique métier (→ N2a), technique JWT (→ N3)

---

## Présentation

Écran centré affiché en dehors du `Layout` (pas de barre latérale). En-tête : logo Ekolova (`Logo`, layout vertical) + sous-titre.

---

## Champs

| Champ | Type | Comportement |
|-------|------|-------------|
| Identifiant | texte | `autoFocus`, `autocomplete="username"`, espaces de fin retirés (`trim`) |
| Mot de passe | password | `autocomplete="current-password"` |

---

## Actions

| Action | Comportement |
|--------|-------------|
| Se connecter | Soumet le formulaire → `login()`. Bouton en état `loading` pendant l'appel. |
| Mot de passe oublié ? | Lien qui bascule en mode `forgot` : saisie de l'email → `POST /auth/forgot-password`. Réponse **neutre** (« Si un compte existe pour cette adresse, un email vient d'être envoyé »), aucune information sur l'existence du compte. |
| Réinitialiser (page dédiée) | Sur `/reinitialiser-mot-de-passe?token=…`, saisie du nouveau mot de passe (politique ≥ 8 car., lettre + chiffre) → `POST /auth/reset-password` → redirection vers `/login`. |

---

## Comportements

| Situation | Comportement |
|-----------|-------------|
| Utilisateur déjà authentifié | Redirection immédiate hors de `/login` (vers la page d'origine ou `/dashboard`) |
| Connexion réussie | Redirection vers la page d'origine (`location.state.from`) ou `/dashboard` |
| Compte avec `mustChangePassword` (1ʳᵉ connexion / mot de passe généré) | `PasswordGate` **bloque l'accès à l'application** tant qu'un nouveau mot de passe n'est pas défini |
| Identifiants invalides | Message d'erreur générique affiché au-dessus du formulaire |
| Trop de tentatives | Après 5 échecs sur le même identifiant, blocage temporaire (15 min) — message générique |
| Serveur injoignable | Message « Serveur injoignable » |

---

## Erreurs affichées

| Cause | Message |
|-------|---------|
| Identifiant/mot de passe incorrect, compte inexistant, inactif ou archivé | « Identifiants invalides » (générique, volontaire) |
| Trop de tentatives échouées | Message générique (le compte est temporairement verrouillé) |
| Jeton de réinitialisation invalide ou expiré | Message d'erreur sur la page `/reinitialiser-mot-de-passe` |
| API non disponible | « Serveur injoignable » |
