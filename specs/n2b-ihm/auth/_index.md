# Authentification — Specs IHM

> **Couche** : N2b — QUOI écrans (domaine : Authentification & Comptes)
> **Acteur concerné** : tous (Connexion) · [Administrateur](../../n1-acteurs/administrateur/_index.md) (Utilisateurs)
> **Ce dossier contient** : les pages IHM liées à l'authentification et à la gestion des comptes
> **Ce dossier NE contient PAS** : logique métier (→ N2a), patterns techniques (→ N3)

---

## Vue d'ensemble — Pages

| Page | Description | Route | Protection | Statut |
|------|-------------|-------|------------|--------|
| [Connexion](page-connexion.md) | Écran de connexion (identifiant + mot de passe) | `/login` | Public | Rédigé |
| [Utilisateurs](page-utilisateurs.md) | Gestion des comptes (création, rôles, statut, mots de passe) | `/utilisateurs` | `RequireAuth roles={['admin']}` | Rédigé |
