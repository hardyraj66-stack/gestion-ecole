<a id="BC-MAT"></a>
# BC-MAT — Bounded Context : Matières

> **Couche** : N2a — QUOI (métier)
> **Ce fichier contient** : identité du BC, rôle, agrégats, use cases, contrat API
> **Ce fichier NE contient PAS** : détails d'écrans (→ N2b), détails techniques (→ N3)

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Identifiant | BC-MAT |
| Nom | Matières |
| Module NestJS | `MatieresModule` |
| Collection MongoDB | `matieres` |
| Canal Socket.IO | `matieres` |

---

## Rôle

Gérer le référentiel des matières enseignées. Chaque matière possède un code unique, une couleur d'affichage, et des coefficients par niveau scolaire.

---

## Responsabilités

1. Créer une matière avec ses coefficients par niveau
2. Modifier une matière existante
3. Désactiver une matière (soft-delete via champ `actif`)
4. Fournir les matières pour les sélecteurs de notes, planning, et bulletin

---

## Agrégat principal — Matière

| Champ | Type | Contrainte |
|-------|------|-----------|
| `nom` | string | requis |
| `code` | string | requis — identifiant court (ex: `"MATH"`) |
| `coefficient` | number | défaut 1 — valeur legacy si `coefficients` vide |
| `coefficients` | `[{ niveau: string, coefficient: number }]` | coefficients par niveau scolaire |
| `description` | string | optionnel |
| `couleur` | string | code couleur hex (ex: `"#2563eb"`) |
| `actif` | boolean | défaut `true` |

**Index MongoDB :**
- `{ actif: 1 }`

---

## Use Cases

| Ref. | Nom | Endpoint |
|------|-----|---------|
| UC-MAT-001 | Créer une matière | `POST /matieres` |
| UC-MAT-002 | Modifier une matière | `PATCH /matieres/:id` |
| UC-MAT-003 | Désactiver une matière | `PATCH /matieres/:id/desactiver` |

---

## Contrat API

### POST /matieres
**Corps** : `{ nom, code, coefficient?, coefficients?, description?, couleur? }`
**Réponse** : objet Matière créé
**Événement** : `matiere:created`

### PATCH /matieres/:id
**Corps** : champs partiels de Matière
**Réponse** : objet Matière mis à jour
**Événement** : `matiere:updated`

### PATCH /matieres/:id/desactiver
**Corps** : aucun
**Réponse** : `{ id }`
**Événement** : `matiere:updated`

---

## Règles métier

| Règle | Description |
|-------|-------------|
| R-MAT-001 | Le code matière doit être unique par établissement |
| R-MAT-002 | Le coefficient utilisé pour un niveau est celui de `coefficients[niveau]` en priorité, sinon le champ `coefficient` global |
| R-MAT-003 | La couleur est affichée dans les créneaux du planning et les cartes de matière |

---

## Événements Socket.IO émis

| Événement | Payload | Déclencheur |
|-----------|---------|-------------|
| `matiere:created` | objet Matière | POST /matieres |
| `matiere:updated` | objet Matière ou `{ id }` | PATCH /matieres/:id ou /desactiver |
