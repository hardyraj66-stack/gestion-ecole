# ☁️ Configuration Oracle Cloud — Ekolova (pas à pas)

> **But :** documenter **tout ce qui est configuré dans la console Oracle Cloud (OCI)**
> pour Ekolova, écran par écran, pour pouvoir le **refaire**, le **vérifier** ou le **réparer**
> sans rien deviner.
>
> Ce document couvre la partie **console Oracle** uniquement. La partie système (swap,
> Docker, Caddy, GitHub Actions…) est dans [`guide-installation.md`](./guide-installation.md).
> La sauvegarde des données est détaillée dans [`backup/README.md`](./backup/README.md).

Statut : ✅ **en place** (juin 2026).

---

## 0. Les valeurs déjà configurées (récap)

| Élément | Valeur actuelle |
|---|---|
| **Région** | `eu-frankfurt-1` (Frankfurt) |
| **VM (instance)** | `VM.Standard.E2.1.Micro` — AMD, 1 OCPU / 1 Go RAM (*Always Free*) |
| **IP publique** | `130.162.241.147` |
| **Utilisateur SSH** | `ubuntu` (clé `~/.ssh/ekolova.key`) |
| **Ports ouverts (VCN)** | `80` et `443` (TCP, depuis `0.0.0.0/0`) |
| **Object Storage — namespace** | `frx8l52ib3id` |
| **Object Storage — bucket** | `ekolova-backups` |
| **Accès écriture au bucket** | Pre-Authenticated Request (**PAR**) en écriture — URL secrète dans `~/ekolova/.env` |

> 💡 **Tout est en *Always Free*** : la VM E2.1.Micro et 10 Go d'Object Storage sont gratuits
> à vie tant qu'on reste dans ces quotas. Une sauvegarde fait < 1 Mo.

---

## Partie A — La machine virtuelle (Compute)

### A1. Créer l'instance

Console OCI → menu ☰ → **Compute → Instances → Create instance**.

1. **Name** : ex. `ekolova`.
2. **Image and shape → Change shape → onglet « Specialty and previous generation »**
   → choisir **`VM.Standard.E2.1.Micro`** (marqué *Always Free-eligible*).
   - ⚠️ **Ne PAS** prendre `VM.Standard.E5.Flex` (payante).
   - Éviter `A1.Flex` (Ampere) : souvent *« Out of capacity »*.
   - Si *« not available in this AD »* → changer d'**Availability Domain** (AD-1, AD-2…).
3. **Image** : **Ubuntu** (dernière LTS).
4. **Networking** : laisser OCI **créer un VCN + subnet public**, et **assigner une IP publique**.
5. **Add SSH keys** : *Generate a key pair for me* → **télécharger la clé privée**
   (ou coller ta propre clé publique). En local :
   ```bash
   mv ~/Downloads/ssh-key-*.key ~/.ssh/ekolova.key
   chmod 600 ~/.ssh/ekolova.key
   ```
6. **Create** → attendre l'état **Running** → noter l'**IP publique**.

> La VM n'a qu'**1 Go de RAM** : la mise en place du **swap 4 Go** (côté OS, étape 4 du
> guide d'installation) est indispensable, sinon les builds Docker sont tués (OOM).

### A2. Réserver l'IP publique (recommandé)

Par défaut l'IP est **éphémère** (peut changer au stop/start). Pour la figer :
**Instance → Resources → Attached VNICs → (VNIC primaire) → IPv4 Addresses → … → Edit**
→ passer l'IP publique de **Ephemeral** à **Reserved**.

> Si l'IP change un jour, il faut remettre à jour le **record A DuckDNS**
> (cf. `guide-installation.md`, étape 9).

---

## Partie B — Le réseau (ouvrir 80/443 dans le VCN)

> Il y a **deux pare-feux** : celui du **VCN** (ici, console Oracle) **et** celui de l'**OS**
> (`iptables`, côté VM — cf. guide d'installation). **Les deux** doivent autoriser 80/443.

Console OCI → ☰ → **Networking → Virtual Cloud Networks → (ton VCN) → Subnets →
(ton subnet) → Security Lists → Default Security List → Add Ingress Rules**.

Créer **2 règles d'entrée** (une pour `80`, une pour `443`) :

| Champ | Valeur |
|---|---|
| Stateless | **non** (décoché) |
| Source Type | CIDR |
| Source CIDR | `0.0.0.0/0` |
| IP Protocol | TCP |
| Source Port Range | *(laisser **vide**)* |
| **Destination Port Range** | **`80`** (puis **`443`** pour la 2ᵉ règle) |

> ⚠️ **Erreur classique** : mettre le port dans *Source* Port Range. Le port d'écoute va
> **toujours** dans **Destination** Port Range ; *Source Port Range* reste **vide**.

**Vérifier** (depuis ta machine) : `curl -I http://130.162.241.147/` doit répondre
(et non *timeout*). Un timeout = un des deux pare-feux bloque encore.

---

## Partie C — Stockage des sauvegardes (Object Storage)

C'est ici que la copie **distante** des sauvegardes Mongo est déposée chaque nuit.
Voir [`backup/README.md`](./backup/README.md) pour le fonctionnement complet.

### C1. Créer le bucket

Console OCI → ☰ → **Storage → Buckets** (sous *Object Storage & Archive Storage*)
→ vérifier le **Compartment** (en haut à gauche) → **Create Bucket**.

| Champ | Valeur |
|---|---|
| **Bucket Name** | `ekolova-backups` |
| **Default Storage Tier** | **Standard** |
| Object Events / Versioning / Encryption | valeurs par défaut |

→ **Create**. Le bucket apparaît dans la liste.

> Le **namespace** (`frx8l52ib3id`) s'affiche sur la page du bucket (onglet **Details**) ;
> c'est l'identifiant unique du tenancy Object Storage. On le retrouve aussi dans l'URL de la PAR.

### C2. Créer la clé d'écriture (Pre-Authenticated Request / PAR)

La VM **n'a aucune clé API Oracle**. Elle envoie les sauvegardes via une **PAR** : une URL
secrète qui donne **uniquement le droit d'écrire** dans ce bucket. Pratique et sans risque
de fuite de credentials complets.

> 🧭 **Navigation (selon la version de l'UI) :**
> - UI récente : page du bucket → onglet **Management** (en haut) → section
>   **Pre-authenticated requests**.
> - UI plus ancienne : page du bucket → colonne de gauche **Resources** →
>   **Pre-Authenticated Requests**.

Étapes :

1. **Create Pre-Authenticated Request**.
2. **Name** : ex. `ekolova-backup-write`.
3. **PAR Type / Target** : **Bucket** (et non « Object » — on veut écrire **plusieurs**
   fichiers, un par jour).
4. **Access Type** : **Permit object writes** (écriture seule — *pas* de lecture/liste).
5. **Expiration** : choisir une date **lointaine** (ex. +2 ans). À noter pour le renouvellement.
6. **Create** → **copier l'URL affichée IMMÉDIATEMENT** : elle n'est montrée **qu'une seule
   fois**. Forme :
   ```
   https://objectstorage.eu-frankfurt-1.oraclecloud.com/p/<jeton-secret>/n/frx8l52ib3id/b/ekolova-backups/o/
   ```

7. **Coller l'URL sur la VM** dans `~/ekolova/.env` (gitignoré, jamais dans le dépôt) :
   ```
   BACKUP_PAR_URL=https://objectstorage.eu-frankfurt-1.oraclecloud.com/p/.../o/
   ```
8. **Tester** : `~/ekolova/backup/backup-mongo.sh` puis `tail ~/ekolova/backup/backup.log`
   → doit afficher `Upload Object Storage OK`. Vérifier dans la console : bucket → onglet
   **Objects** → un fichier `.gz` est apparu.

> 🔒 **L'URL de la PAR est un secret** (= droit d'écriture sur le bucket). Elle vit
> **uniquement** dans `~/ekolova/.env` sur la VM. Elle n'est **jamais** dans Git ni en mémoire.
> Si elle fuite : la **supprimer** dans la console (la liste des PAR) et en recréer une.

### C3. (Optionnel) Politique de cycle de vie (lifecycle)

Pour purger automatiquement les vieux objets du bucket (au-delà de X jours) :
bucket → onglet **Management** (ou *Resources*) → **Lifecycle Policy Rules** →
**Create Rule** (ex. *Delete* après `90` jours).

> ⚠️ **Selon la version de l'UI, cette section peut être absente.** Ce n'est **pas
> bloquant** : chaque sauvegarde fait < 1 Mo contre 10 Go gratuits — on peut tenir des
> années sans purge distante. La rotation **locale** (14 jours) est, elle, gérée par le
> script `backup-mongo.sh`. *Sur notre install, cette règle n'a pas été créée (option non
> exposée dans l'UI au moment de la mise en place).*

---

## Partie D — Vérifier que tout est bon (côté Oracle)

- ✅ **Compute → Instances** : l'instance `ekolova` est **Running**, IP `130.162.241.147`.
- ✅ **Networking → VCN → Security List** : 2 règles Ingress (80 et 443, Destination Port).
- ✅ `curl -I http://130.162.241.147/` depuis l'extérieur **répond** (pas de timeout).
- ✅ **Storage → Buckets** : `ekolova-backups` existe.
- ✅ Bucket → **Management** : une **PAR** *Permit object writes* active (non expirée).
- ✅ Bucket → **Objects** : au moins un fichier `ekolova-gestion-ecole-AAAA-...gz` (déposé
  par la dernière sauvegarde nocturne).

---

## Partie E — Entretien & dépannage (Oracle)

| Situation | Quoi faire (console Oracle) |
|---|---|
| **PAR expirée** (l'upload échoue dans `backup.log`) | Bucket → Management → recréer une PAR *Permit object writes*, remettre l'URL dans `~/ekolova/.env` (cf. C2). La sauvegarde **locale** continue entre-temps. |
| **PAR potentiellement fuitée** | Bucket → Management → liste des PAR → **Delete** celle compromise → en recréer une neuve. |
| `curl` extérieur **timeout** | Vérifier la **Security List** du VCN (Partie B) **ET** `iptables` côté OS. |
| **IP publique a changé** | La rendre *Reserved* (A2) + mettre à jour le record A DuckDNS. |
| Bucket **plein** (improbable : 10 Go) | Créer une **lifecycle policy** (C3) ou supprimer manuellement de vieux objets. |
| Besoin de **récupérer** une sauvegarde distante | Bucket → Objects → (objet `.gz`) → ⋮ → **Download** → `scp` sur la VM → `restore-mongo.sh`. |

---

*Voir aussi : [`guide-installation.md`](./guide-installation.md) (système & app),
[`architecture.md`](./architecture.md) (vue d'ensemble),
[`backup/README.md`](./backup/README.md) (sauvegardes).*
*Dernière mise à jour : 2026-06-12.*
