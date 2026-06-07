<a id="PAGE-AUT-001"></a>
# Connexion

> **Couche** : N2b — QUOI écrans (page : Connexion)
> **Acteur concerné** : tous
> **UC sous-jacents** : [UC-AUT-001](../../n2a-domaine/bc-auth/_index.md)
> **Type de page** : Formulaire plein écran (hors Layout)
> **Route** : `/login` (publique)
> **Source de données** : `AuthContext.login(username, password)` → `POST /auth/login`
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

---

## Comportements

| Situation | Comportement |
|-----------|-------------|
| Utilisateur déjà authentifié | Redirection immédiate hors de `/login` (vers la page d'origine ou `/dashboard`) |
| Connexion réussie | Redirection vers la page d'origine (`location.state.from`) ou `/dashboard` |
| Identifiants invalides | Message d'erreur générique affiché au-dessus du formulaire |
| Serveur injoignable | Message « Serveur injoignable » |

---

## Erreurs affichées

| Cause | Message |
|-------|---------|
| Identifiant/mot de passe incorrect, compte inexistant ou inactif | « Identifiants invalides » (générique, volontaire) |
| API non disponible | « Serveur injoignable » |
