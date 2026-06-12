# 🚑 Plan de reprise sur incident — Ekolova

> **Quoi faire quand « ça plante ».** Les scénarios sont classés du **plus fréquent / moins
> grave** au **plus rare / catastrophique**. Commence par le **Scénario 1** et descends.
>
> 🔑 **Le seul vrai garde-fou contre une perte de données = la sauvegarde**
> (cf. [`backup/README.md`](./backup/README.md)). Tout le reste se reconstruit.

**Avant tout, se connecter au serveur :**
```bash
ssh -i ~/.ssh/ekolova.key ubuntu@130.162.241.147
cd ~/ekolova
```

---

## 🔎 Diagnostic en 30 secondes

```bash
docker compose ps                  # les 3 conteneurs (mongo, app, caddy) sont-ils 'Up' ?
docker compose logs app --tail=40  # erreurs côté application
curl -I http://localhost/          # réponse HTTP locale ?
```

Selon ce que tu vois :

| Constat | Va au… |
|---|---|
| Le site rame / **502** mais les conteneurs tournent | **Scénario 1** |
| Un conteneur est **Exited / Restarting** | **Scénario 2** |
| Les **données sont fausses / effacées** (mauvaise manip) | **Scénario 3** |
| **Plus de SSH du tout**, VM injoignable | **Scénario 4** |
| **HTTPS cassé** (cadenas invalide) | **Scénario 5** |

---

## Scénario 1 — Le site est lent ou répond « 502 » (le plus fréquent)

**Cause la plus courante : un déploiement vient d'avoir lieu.** L'app redémarre → ~30 s de
502, c'est **normal**, ça revient tout seul.

Si ça persiste au-delà d'une minute :
```bash
docker compose logs app --tail=50      # chercher l'erreur
docker compose restart app             # redémarrage simple
# si ça ne suffit pas :
docker compose up -d --build           # reconstruire l'app
```

Causes typiques dans les logs :
- `JWT_SECRET` manquant / < 32 caractères → vérifier `~/ekolova/server/.env`.
- `MongoServerError: Authentication failed` → identifiants Mongo (cf. Scénario 2).

➡️ **Aucune donnée n'est touchée ici.** On ne fait que redémarrer du code.

---

## Scénario 2 — Un conteneur ne démarre plus

```bash
docker compose ps                      # repérer le conteneur en échec
docker compose logs <mongo|app|caddy> --tail=60
docker compose up -d                   # tente de tout relancer
```

- **app** en boucle → presque toujours config (`server/.env`) ou Mongo injoignable.
- **mongo** en échec → voir Scénario 3 (les données vivent dans le volume `mongo-data`,
  qui **survit** au redémarrage des conteneurs ; un conteneur qui plante ≠ données perdues).
- **caddy** en échec → voir Scénario 5.

Redémarrage propre de toute la stack (sans toucher aux données) :
```bash
docker compose down        # arrête les conteneurs (le volume mongo-data RESTE)
docker compose up -d --build
```

> ⚠️ **Ne JAMAIS faire `docker compose down -v`** : le `-v` **supprime le volume**
> = **efface toute la base**. Sans `-v`, les données sont conservées.

---

## Scénario 3 — Données effacées / corrompues (VM intacte) → RESTAURATION

C'est le cas « j'ai fait une mauvaise manip » ou « la base est incohérente ».
On remet la dernière bonne sauvegarde.

```bash
# 1. Voir les sauvegardes locales disponibles (les 14 derniers jours)
~/ekolova/backup/restore-mongo.sh

# 2. Restaurer une date précise (choisir un fichier d'AVANT l'incident)
~/ekolova/backup/restore-mongo.sh ~/ekolova/backup/dumps/ekolova-gestion-ecole-2026-06-12_031500.gz
#    → le script demande de taper 'oui' (il REMPLACE les données actuelles : --drop)
```

Si **aucune** copie locale ne convient (toutes postérieures à l'incident) → récupérer une
sauvegarde **distante** depuis le coffre Oracle :

1. Console OCI → bucket **ekolova-backups** → onglet **Objects** → choisir un `.gz` → ⋮ → **Download**.
2. L'envoyer sur la VM puis restaurer :
   ```bash
   # 🖥️ depuis ta machine, après avoir téléchargé le .gz :
   scp -i ~/.ssh/ekolova.key ekolova-gestion-ecole-XXXX.gz ubuntu@130.162.241.147:~/ekolova/backup/dumps/
   ```
   ```bash
   # ☁️ sur la VM :
   ~/ekolova/backup/restore-mongo.sh ~/ekolova/backup/dumps/ekolova-gestion-ecole-XXXX.gz
   ```

➡️ Après restauration, recharger le site : les données sont revenues à l'état de la sauvegarde choisie.

---

## Scénario 4 — La VM entière est perdue (catastrophe) → RECONSTRUCTION COMPLÈTE

VM supprimée, disque mort, plus aucun SSH. **C'est le scénario pour lequel la copie
distante existe.** On reconstruit le serveur, puis on réinjecte les données.

1. **Recréer la VM + le réseau Oracle** → suivre [`oracle-cloud.md`](./oracle-cloud.md)
   (instance E2.1.Micro, IP, ports 80/443).
2. **Réinstaller la stack** (Docker, dépôt, `.env`, HTTPS) → suivre
   [`guide-installation.md`](./guide-installation.md).
   - Au premier démarrage la base est **vide** (ou des données de démo) — c'est attendu.
3. **Remettre la dernière sauvegarde distante** :
   - Console OCI → bucket **ekolova-backups** → **Objects** → télécharger le `.gz` **le plus récent**.
   - Le déposer sur la nouvelle VM (`scp`, cf. Scénario 3) et lancer `restore-mongo.sh`.
4. **Reconfigurer la sauvegarde** sur la nouvelle VM (cron + PAR) → cf. `backup/README.md`.
5. Si l'**IP a changé** → mettre à jour le record A **DuckDNS** pour que
   `ekolova.duckdns.org` pointe vers la nouvelle IP.

➡️ Le site repart à l'identique, avec les données de la dernière nuit sauvegardée.

---

## Scénario 5 — HTTPS cassé (cadenas invalide / « non sécurisé »)

```bash
docker compose logs caddy --tail=40 | grep -i -E 'error|certificate'
```
- Le certificat se renouvelle **tout seul** ; une erreur vient presque toujours d'un
  **port 80/443 fermé** ou du **domaine qui ne résout plus**.
- Vérifier : ports ouverts (cf. `oracle-cloud.md` §B) et `dig +short ekolova.duckdns.org`
  doit renvoyer l'IP de la VM.
- Forcer un nouvel essai : `docker compose restart caddy`.

➡️ Aucune donnée touchée.

---

## ✅ Réflexes à garder

- **Ne pas paniquer** : tant que les **sauvegardes** existent (local + coffre Oracle), les
  données sont récupérables. Le code et le serveur se reconstruisent.
- **`down -v` = interdit** (efface la base). Pour redémarrer, `docker compose down` sans `-v`.
- **Avant une grosse manip risquée**, lancer une sauvegarde fraîche :
  `~/ekolova/backup/backup-mongo.sh`
- **Toujours restaurer une copie d'AVANT l'incident** (vérifier la date du fichier `.gz`).

---

*Voir aussi : [`backup/README.md`](./backup/README.md) · [`guide-installation.md`](./guide-installation.md) · [`oracle-cloud.md`](./oracle-cloud.md) · [`architecture.md`](./architecture.md).*
*Dernière mise à jour : 2026-06-12.*
