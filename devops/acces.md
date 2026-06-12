# 🔗 Accès & liens — Ekolova

> Les points d'accès importants du projet, au même endroit.
> ⚠️ **Aucun secret ici** (pas de mot de passe, pas de clé, pas d'URL de PAR).

---

## Site en ligne

| | |
|---|---|
| **URL de l'application** | **https://ekolova.duckdns.org** |
| Protocole | HTTPS (certificat Let's Encrypt, renouvelé automatiquement par Caddy) |
| API | `https://ekolova.duckdns.org/api` |

> L'ancienne URL `…sslip.io` ne répond plus (Caddy n'écoute que sur le domaine courant).

---

## Connexion à l'application

| | |
|---|---|
| Compte administrateur | `admin` |
| Mot de passe | *(par défaut réinitialisé — défini à la 1ʳᵉ connexion, `mustChangePassword`)* |
| Mot de passe oublié | possible uniquement pour les comptes **avec email** (pas l'admin par défaut) |

---

## Administration / infrastructure

| Ressource | Accès |
|---|---|
| **Serveur (SSH)** | `ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147` |
| Dépôt sur la VM | `~/ekolova` (suit la branche `main`) |
| **Console Oracle Cloud** | https://cloud.oracle.com — région `eu-frankfurt-1` |
| **DuckDNS** (domaine) | https://www.duckdns.org — sous-domaine `ekolova` |
| **GitHub (dépôt + déploiement)** | onglet *Actions* → workflow **Deploy — Oracle Cloud** |

---

## Documentation infra

- [`guide-installation.md`](./guide-installation.md) — réinstaller de zéro (système + app)
- [`oracle-cloud.md`](./oracle-cloud.md) — configuration Oracle pas à pas (VM, réseau, stockage)
- [`architecture.md`](./architecture.md) — vue d'ensemble des composants
- [`backup/README.md`](./backup/README.md) — sauvegarde & restauration des données

---

*Dernière mise à jour : 2026-06-12.*
