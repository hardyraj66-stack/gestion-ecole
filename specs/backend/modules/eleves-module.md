# Module Élèves

**Dossier source :** `server/src/eleves/`

---

## Controller — `ElevesController`

**Préfixe :** `/eleves`

### Endpoints

```
POST   /eleves
  Body: { nom, prenom, date_naissance, genre, classe_id, email?, telephone?, adresse?, pere?, mere?, tuteur? }
  → ElevesService.create(dto)
  → Émet: eleve:created

PATCH  /eleves/:id
  Body: Partial<Eleve>
  → ElevesService.update(id, dto)
  → Émet: eleve:updated

PATCH  /eleves/:id/statut
  Body: { statut: EleveStatut, raison?, commentaire?, date?, motif?, nb_avertissements? }
  → ElevesService.setStatut(id, dto)
  → Émet: eleve:updated
```

---

## Service — `ElevesService`

### create(dto)
1. Crée l'élève dans MongoDB
2. Initialise `historique_classes` avec la classe courante et l'année active
3. `ViewBuilderService.rebuildEleve(id)`
4. `ViewBuilderService.rebuildClasse(dto.classe_id)` (mise à jour nb_eleves)
5. `EventsGateway.emit('eleve:created', eleve)`

### update(id, dto)
- Si `classe_id` change : met à jour `historique_classes`, rebuild l'ancienne et la nouvelle classe
- `EventsGateway.emit('eleve:updated', eleve)`

### setStatut(id, dto)

Transitions de statut :

**actif → exclu :**
1. Met à jour `eleve.statut = 'exclu'`
2. Crée une entrée dans `exclusions` : `{ eleve_id, nom, prenom, classe_id, classe_nom, date_exclusion, raison, commentaire, nb_avertissements_au_moment, annee_scolaire }`
3. Rebuild vue élève
4. Émet `eleve:updated`

**actif → parti :**
1. Met à jour `eleve.statut = 'parti'`
2. Retire l'élève de sa classe (`classe_id = null`)
3. Crée une entrée dans `departs`
4. Rebuild vue élève + vue classe
5. Émet `eleve:updated`

**exclu → actif (réintégration) :**
1. Met à jour `eleve.statut = 'actif'`
2. Rebuild vue élève
3. Émet `eleve:updated`

---

## Dépendances

- `ElevesModule` importe `ClassesModule` pour accéder à `ClassesService`
- `ExclusionsModule` et `DepartsModule` pour créer les entrées de suivi
- `EventsModule`, `ReadModule`
