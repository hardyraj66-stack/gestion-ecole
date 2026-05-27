# Manuel — Gestion des élèves

## Consulter la liste des élèves

La page **Élèves** affiche tous les élèves de l'établissement.

### Filtrer et rechercher

- **Recherche** : saisir le nom ou le prénom
- **Filtre par classe** : sélectionner une classe dans la liste

### Statuts des élèves

| Statut | Signification | Couleur |
|--------|---------------|---------|
| Actif | Élève en cours de scolarité | Vert |
| Exclu | Élève exclu de l'établissement | Rouge |
| Parti | Élève ayant quitté l'établissement | Gris |

---

## Inscrire un nouvel élève

1. Cliquer sur **Nouvel élève**
2. Remplir la section **Identité** :
   - Nom, Prénom
   - Date de naissance
   - Genre (M/F)
   - Classe d'affectation
   - Email, Téléphone, Adresse (optionnels)
3. Remplir optionnellement la section **Famille** :
   - Informations du père (nom, prénom, téléphone, email, statut vivant/décédé)
   - Informations de la mère
   - Informations du tuteur (si pas de parents)
4. Cliquer sur **Enregistrer l'élève**

---

## Fiche élève

Cliquer sur un élève pour accéder à sa fiche complète, qui comporte 5 onglets :

### Onglet Identité
- Informations personnelles de l'élève
- Bouton **Modifier** pour mettre à jour les informations

### Onglet Famille
- Informations des parents/tuteur
- Consultable mais non modifiable directement (passer par le bouton Modifier)

### Onglet Assiduité
- Tableau de toutes les absences et retards
- Bouton **Ajouter une absence** :
  - Choisir type (absence/retard), date, durée, motif, justifiée ou non
- Compteurs : total absences, retards, justifiées

### Onglet Avertissements
- Liste des avertissements (comportement, dégâts, absence, autre)
- Liste des convocations des parents
- Bouton **Ajouter un avertissement**
- > ⚠️ Après 3 avertissements, une convocation est automatiquement générée

### Onglet Statut
Permet de gérer le statut de l'élève :

**Exclure un élève :**
1. Cliquer sur **Exclure l'élève**
2. Renseigner la raison et un commentaire
3. Confirmer — l'élève passe en statut "Exclu" et est retiré de la liste active

**Signaler un départ :**
1. Cliquer sur **Élève parti**
2. Choisir le motif (changement d'école, déménagement, raison familiale, autre)
3. Renseigner la date de départ et un commentaire
4. Confirmer

**Réintégrer un élève exclu :**
1. Cliquer sur **Réintégrer**
2. L'élève repasse en statut "Actif"

---

## Bulletin de notes

Depuis la fiche élève ou la liste des élèves, cliquer sur **Bulletin**.

La page affiche le bulletin pour le trimestre sélectionné :
- Tableau des matières avec DS, Évaluation, Moyenne et Coefficient
- Moyenne générale pondérée en bas du tableau
- Onglets pour basculer entre Trimestre 1, 2 et 3

Les notes sont colorées :
- Rouge : < 8
- Orange : 8 à 10
- Jaune : 10 à 14
- Vert : ≥ 14
