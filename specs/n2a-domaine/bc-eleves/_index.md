<a id="BC-ELV"></a>
# BC-ELV — Bounded Context : Élèves

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-ELV |
| Nom | Élèves |
| Module NestJS | `ElevesModule` |
| Collection MongoDB | `eleves` |
| Canal Socket.IO | `eleves` |

---

## Rôle

Gérer les dossiers des élèves de l'établissement : inscription, informations personnelles et familiales, historique des classes par année scolaire, et statut (actif / exclu / parti).

---

## Responsabilités

1. Inscrire un élève dans une classe
2. Modifier les informations personnelles et familiales
3. Gérer le statut de l'élève (actif, exclu, parti)
4. Maintenir l'historique des classes par année scolaire

---

## Agrégat principal — Élève

| Champ | Type | Contrainte |
|-------|------|-----------|
| `nom` | string | requis |
| `prenom` | string | requis |
| `date_naissance` | string | requis |
| `genre` | `'M'` \| `'F'` | requis |
| `classe_id` | string | requis |
| `email` | string | optionnel |
| `telephone` | string | optionnel |
| `adresse` | string | optionnel |
| `pere` | objet ou null | `{ nom, prenom, telephone, email, statut: 'vivant'\|'decede' }` |
| `mere` | objet ou null | idem père |
| `tuteur` | objet ou null | `{ nom, prenom, telephone, email, lien }` |
| `statut` | `'actif'` \| `'exclu'` \| `'parti'` | défaut `'actif'` |
| `historique_classes` | tableau | `[{ annee_scolaire, classe_id, classe_nom, niveau, statut }]` |

**Index MongoDB :**
- `{ classe_id: 1 }`
- `{ 'historique_classes.annee_scolaire': 1 }`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-ELV-001 | Inscrire un élève | `POST /eleves` |
| UC-ELV-002 | Modifier le dossier d'un élève | `PATCH /eleves/:id` |
| UC-ELV-003 | Changer le statut (exclu/parti) | `PATCH /eleves/:id` (champ `statut`) |

---

## Contrat API

### POST /eleves
**Corps** : `{ nom, prenom, date_naissance, genre, classe_id, email?, telephone?, adresse?, pere?, mere?, tuteur? }`
**Réponse** : objet Élève créé
**Événement** : `eleve:created`

### PATCH /eleves/:id
**Corps** : champs partiels de Élève
**Réponse** : objet Élève mis à jour
**Événement** : `eleve:updated`

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-ELV-001 | Un élève doit être rattaché à une classe existante |
| R-ELV-002 | Le changement de statut vers `exclu` ou `parti` peut déclencher des entrées dans les collections `exclusions` ou `departs` (géré côté frontend via les modules Suivi) |
| R-ELV-003 | L'historique des classes est alimenté automatiquement lors du démarrage d'une nouvelle année scolaire |

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `eleve:created` | objet Élève | POST /eleves |
| `eleve:updated` | objet Élève | PATCH /eleves/:id |
