> **Couche** : N1 — QUI (acteurs, rôles, parcours)
> **Ce fichier contient** : identité, rôle, plateforme d'accès, parcours par domaine
> **Ce fichier NE contient PAS** : détails métier (→ N2a), détails d'écrans (→ N2b), détails techniques (→ N3)

# Acteur — Direction

---

## Identité

| Attribut | Valeur |
|----------|--------|
| Nom | Direction / Chef d'établissement |
| Accès | Application web complète |
| Authentification | Aucune (réseau local sécurisé) |
| Application | Front web React, desktop |

---

## Description

La direction consulte les données de l'établissement, configure les référentiels (niveaux, matières, salles, professeurs), gère le cycle des années scolaires, et consulte les archives des années passées. Elle peut également effectuer toutes les opérations du secrétariat.

---

## Parcours par domaine

### Configuration de l'établissement
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-DIR-001 | [Configurer les niveaux et matières](parcours-configuration.md) | Créer les niveaux scolaires et les matières avec coefficients | Rédigé |
| PA-DIR-002 | [Gérer les salles](parcours-salles.md) | Créer et maintenir le référentiel des salles | Rédigé |
| PA-DIR-003 | [Gérer les professeurs](parcours-professeurs.md) | Créer les profils professeurs et gérer leurs affectations | Rédigé |

### Cycle annuel
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-DIR-004 | [Gérer le cycle de l'année scolaire](parcours-annee.md) | Préparer, démarrer et clôturer une année scolaire | Rédigé |
| PA-DIR-005 | [Consulter les archives](parcours-archives.md) | Accéder en lecture seule aux données d'une année passée | Rédigé |

### Consultation
| # | Parcours | Description | Statut |
|---|----------|-------------|--------|
| PA-DIR-006 | [Consulter le tableau de bord](parcours-dashboard.md) | Vue synthétique de l'établissement | Rédigé |
