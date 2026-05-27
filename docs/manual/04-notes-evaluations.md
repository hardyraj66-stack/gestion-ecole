# Manuel — Notes et Évaluations

## Deux façons de saisir des notes

### 1. Saisie directe (page Notes)

Pour saisir des notes rapidement sans créer d'évaluation formelle.

1. Aller dans **Notes**
2. Sélectionner :
   - **Classe**
   - **Matière**
   - **Trimestre** (1, 2 ou 3)
   - **Type** (DS ou Évaluation)
3. La liste des élèves de la classe s'affiche
4. Pour chaque élève : saisir la note (0–20) dans le champ prévu
5. Cliquer sur **Enregistrer** (par ligne ou "Tout enregistrer")

Les statistiques (moyenne, min, max) se mettent à jour automatiquement.

> 💡 Si une note existe déjà pour cet élève/matière/trimestre/type, elle est affichée et peut être modifiée.

### Annuler une note

Cliquer sur le bouton **Annuler** à côté d'une note. La note est marquée comme annulée (elle ne compte plus dans les calculs) mais reste dans la base de données.

---

### 2. Via les évaluations (page Évaluations)

Plus structuré : permet de créer une évaluation formelle, saisir toutes les notes, puis la publier.

#### Créer une évaluation

1. Aller dans **Évaluations** → **Liste** → **Nouvelle évaluation**
2. Remplir :
   - **Type** : DS ou Évaluation
   - **Classe**
   - **Matière**
   - **Trimestre**
   - **Date**
3. Cliquer sur **Créer** → redirigé vers la page de saisie

#### Saisir les notes d'une évaluation

Sur la page de détail de l'évaluation (statut : Brouillon) :
- Pour chaque élève : saisir la note ou cocher **Absent**
- Cliquer sur **Enregistrer les notes**

> 💡 Un élève absent ne reçoit pas de note — il n'est pas pénalisé dans le calcul du bulletin.

#### Publier une évaluation

Quand toutes les notes sont saisies :
1. Cliquer sur **Publier**
2. Confirmer

La publication :
- Verrouille l'évaluation (plus modifiable)
- Crée automatiquement les notes dans la base de données (accessibles dans le bulletin)
- Affiche les statistiques finales (moyenne, min, max, absents)

> ⚠️ Une évaluation publiée ne peut pas être supprimée ni modifiée.

---

## Périodes d'évaluation

La page **Évaluations** → **Périodes** permet de configurer les dates des périodes DS et Évaluation pour chaque trimestre.

Pour modifier les dates d'une période :
1. Cliquer sur les champs de dates (début et fin)
2. Les dates sont sauvegardées automatiquement

Pour clôturer une période :
- Cliquer sur **Terminer** — la période est verrouillée

---

## Consulter le bulletin d'un élève

Depuis la fiche d'un élève → **Bulletin**, ou depuis la liste des élèves → bouton **Bulletin**.

Le bulletin affiche pour chaque trimestre :
- Toutes les matières avec DS, Évaluation, Moyenne et Coefficient
- La moyenne générale pondérée
- La mention (Insuffisant, Passable, Assez bien, Bien, Très bien)
