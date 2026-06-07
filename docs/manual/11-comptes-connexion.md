# Manuel — Comptes & connexion

## Se connecter

À l'ouverture de l'application, un écran de connexion s'affiche.

1. Saisir votre **identifiant** et votre **mot de passe** (fournis par l'administrateur).
2. Cliquer sur **Se connecter**.

En cas d'erreur, le message « Identifiants invalides » s'affiche. Ce message reste volontairement générique pour des raisons de sécurité (il n'indique pas si le compte existe).

La session reste active plusieurs heures, puis expire automatiquement : vous êtes alors redirigé vers l'écran de connexion.

---

## Se déconnecter

Le bouton de **déconnexion** se trouve en bas de la barre latérale, à côté de votre nom. Une confirmation est demandée avant de fermer la session.

---

## Les rôles

| Rôle | Droits |
|------|--------|
| **Administrateur** | Accès complet à l'application **et** à la gestion des comptes (menu Utilisateurs) |
| **Secrétariat** | Saisie et consultation courantes (élèves, notes, planning, etc.) |
| **Professeur** | Accès en consultation (droits restreints) |

---

## Gérer les comptes (administrateurs)

Le menu **Utilisateurs** n'est visible que pour les administrateurs.

### Créer un compte
1. Cliquer sur **Nouveau compte**.
2. Renseigner l'**identifiant**, le **nom**, le **rôle** et un **mot de passe** (au moins 4 caractères).
3. Valider. Le compte apparaît dans la liste.

> Si l'identifiant est déjà utilisé, un message « Cet identifiant existe déjà » s'affiche.

### Modifier un compte
- **Changer le rôle** : via le menu déroulant de la colonne *Rôle*.
- **Activer / Désactiver** : un compte désactivé ne peut plus se connecter.
- **Réinitialiser le mot de passe** : définit un nouveau mot de passe pour l'utilisateur.
- **Supprimer** : retire définitivement le compte (confirmation demandée).

> Vous ne pouvez pas modifier votre propre rôle, vous désactiver ni vous supprimer.

> Il doit toujours rester **au moins un administrateur actif** : la dernière opération qui supprimerait, désactiverait ou rétrograderait le dernier admin est bloquée.

---

## Changer son propre mot de passe

Tout utilisateur peut changer son mot de passe en fournissant son **mot de passe actuel** et un **nouveau mot de passe**.

---

## Premier démarrage

Au tout premier lancement, un compte administrateur par défaut est créé automatiquement :

- **Identifiant** : `admin`
- **Mot de passe** : `admin123`

⚠️ **Modifiez ce mot de passe dès la première connexion** pour sécuriser l'application.
