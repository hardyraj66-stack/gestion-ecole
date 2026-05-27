<a id="BC-PRO"></a>
# BC-PRO — Bounded Context : Professeurs

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-PRO |
| Nom | Professeurs |
| Module NestJS | `ProfesseursModule` + `TeacherAssignmentsModule` |
| Collections MongoDB | `professeurs`, `teacherassignments` |
| Canal Socket.IO | `professeurs` |

---

## Rôle

Gérer les profils des professeurs et leurs affectations (classe × matière). Un professeur peut être affecté à plusieurs classes et enseigner plusieurs matières.

---

## Responsabilités

1. Créer et gérer les profils des professeurs
2. Activer / désactiver un professeur
3. Gérer les affectations professeur ↔ classe ↔ matière
4. Lister les professeurs actifs pour les sélecteurs de planning

---

## Agrégat principal — Professeur

| Champ | Type | Contrainte |
|-------|------|-----------|
| `nom` | string | requis |
| `prenom` | string | requis |
| `email` | string | optionnel |
| `telephone` | string | optionnel |
| `genre` | `'M'` \| `'F'` | requis |
| `statut` | `'actif'` \| `'inactif'` | défaut `'actif'` |

**Index MongoDB :**
- `{ statut: 1 }`
- `{ nom: 1 }`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-PRO-001 | Créer un profil professeur | `POST /professeurs` |
| UC-PRO-002 | Modifier un profil professeur | `PATCH /professeurs/:id` |
| UC-PRO-003 | Désactiver un professeur | `PATCH /professeurs/:id/desactiver` |
| UC-PRO-004 | Activer un professeur | `PATCH /professeurs/:id/activer` |

---

## Contrat API

### GET /professeurs
**Réponse** : tableau de tous les professeurs

### GET /professeurs/:id
**Réponse** : objet Professeur

### POST /professeurs
**Corps** : `{ nom, prenom, email?, telephone?, genre }`
**Réponse** : objet Professeur créé
**Événement** : `professeur:event`

### PATCH /professeurs/:id
**Corps** : champs partiels de Professeur
**Réponse** : objet Professeur mis à jour
**Événement** : `professeur:event`

### PATCH /professeurs/:id/desactiver
**Réponse** : `{ id }`
**Événement** : `professeur:event`

### PATCH /professeurs/:id/activer
**Réponse** : `{ id }`
**Événement** : `professeur:event`

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `professeur:event` | objet Professeur ou `{ id }` | Toutes les mutations |
