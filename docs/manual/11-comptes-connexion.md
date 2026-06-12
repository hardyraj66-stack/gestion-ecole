# Manuel — Comptes & connexion

## Se connecter

À l'ouverture de l'application, un écran de connexion s'affiche.

1. Saisir votre **identifiant** et votre **mot de passe** (fournis par l'administrateur).
2. Cliquer sur **Se connecter**.

En cas d'erreur, le message « Identifiants invalides » s'affiche. Ce message reste volontairement générique pour des raisons de sécurité (il n'indique pas si le compte existe). Après plusieurs tentatives infructueuses, la connexion est temporairement bloquée quelques minutes.

Si c'est votre **première connexion** (compte tout juste créé, mot de passe reçu par email), l'application vous demande de **définir un nouveau mot de passe** avant de pouvoir continuer.

La session reste active plusieurs heures, puis expire automatiquement : vous êtes alors redirigé vers l'écran de connexion.

### Mot de passe oublié

Sur l'écran de connexion, le lien **« Mot de passe oublié ? »** permet de saisir votre adresse email. Si un compte y est associé, vous recevez un email contenant un lien pour définir un nouveau mot de passe (valable 1 heure). Le message affiché reste neutre, que l'email existe ou non.

---

## Se déconnecter

Le bouton de **déconnexion** se trouve en bas de la barre latérale, à côté de votre nom. Une confirmation est demandée avant de fermer la session.

Depuis la page **Mon profil** (en cliquant sur votre nom dans la barre latérale), vous pouvez aussi voir vos **sessions actives** (par appareil), en révoquer une, ou **déconnecter toutes les sessions** d'un coup.

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

La liste affiche, pour chaque compte, son **email**, son **statut**, sa **présence** (en ligne / hors ligne, en temps réel), l'état de **confirmation** (le mot de passe initial a-t-il été changé) et la **dernière connexion**.

### Créer un compte
1. Cliquer sur **Nouveau compte**.
2. Renseigner l'**email** (requis), le **nom** et le **rôle**. Un mot de passe est généré automatiquement.
3. Valider. Les **identifiants sont envoyés par email** à l'utilisateur, qui devra définir son propre mot de passe à la première connexion.

> Pour le rôle **Professeur**, la création renseigne aussi le prénom et le genre : elle crée la **fiche professeur** en même temps que le compte.

> Si l'identifiant ou l'email est déjà utilisé, un message le signale (et propose un lien vers la fiche du professeur concerné le cas échéant).

### Modifier un compte
- **Modifier** : changer le **nom** et l'**email** du compte.
- **Changer le rôle** : via le menu déroulant de la colonne *Rôle*.
- **Activer / Désactiver** : un compte désactivé ne peut plus se connecter (ses sessions sont coupées immédiatement).
- **Réinitialiser le mot de passe** : génère (ou définit) un nouveau mot de passe ; s'il a un email, les identifiants lui sont renvoyés.
- **Supprimer** : **archive** le compte (il n'est pas réellement effacé). Le bouton **Voir les archives** affiche les comptes archivés, avec une action **Restaurer**.

> Le mot de passe doit faire **au moins 8 caractères** et contenir au moins une lettre et un chiffre.

> Vous ne pouvez pas modifier votre propre rôle, vous désactiver ni vous supprimer.

> Il doit toujours rester **au moins un administrateur actif** : la dernière opération qui supprimerait, désactiverait ou rétrograderait le dernier admin est bloquée.

---

## Mon profil

En cliquant sur votre nom dans la barre latérale, vous accédez à **Mon profil** : modifier votre **nom** et votre **email**, **changer votre mot de passe** (mot de passe actuel + nouveau), et gérer vos **sessions** (voir « Se déconnecter »).

---

## Premier démarrage

Au tout premier lancement, un compte administrateur par défaut est créé automatiquement :

- **Identifiant** : `admin`
- **Mot de passe** : `admin123`

⚠️ **Modifiez ce mot de passe dès la première connexion** pour sécuriser l'application.
