# Schéma Mongoose — Eleve

**Fichier source :** `server/src/eleves/eleve.schema.ts`
**Collection MongoDB :** `eleves`

---

## Schéma

```typescript
@Schema()
class ParentInfo {
  nom: string
  prenom: string
  telephone?: string
  email?: string
  statut: 'vivant' | 'decede'    // défaut: 'vivant'
}

@Schema()
class TuteurInfo {
  nom: string
  prenom: string
  telephone?: string
  email?: string
  lien?: string                  // relation (ex: "oncle")
}

@Schema()
class HistoriqueClasse {
  annee_scolaire: string
  classe_id: string
  classe_nom: string
  statut: string                 // statut de l'élève cette année-là
}

@Schema({ timestamps: true })
class Eleve {
  @Prop({ required: true }) nom: string
  @Prop({ required: true }) prenom: string
  @Prop({ required: true }) date_naissance: Date
  @Prop({ enum: ['M', 'F'], required: true }) genre: string

  @Prop({ type: String, ref: 'Classe' }) classe_id: string
  @Prop() email?: string
  @Prop() telephone?: string
  @Prop() adresse?: string

  @Prop({ type: ParentInfo, default: null }) pere?: ParentInfo
  @Prop({ type: ParentInfo, default: null }) mere?: ParentInfo
  @Prop({ type: TuteurInfo, default: null }) tuteur?: TuteurInfo

  @Prop({ enum: ['actif', 'exclu', 'parti'], default: 'actif' })
  statut: string

  @Prop({ type: [HistoriqueClasse], default: [] })
  historique_classes: HistoriqueClasse[]
}
```

---

## Index

```javascript
{ classe_id: 1 }
{ 'historique_classes.annee_scolaire': 1 }
```

---

## Notes importantes

- `historique_classes` est mis à jour à chaque changement de classe ou de statut — permet de retrouver l'historique de l'élève par année
- `pere`, `mere`, `tuteur` peuvent être `null` (famille non renseignée)
- `statut = 'exclu'` → l'entrée dans `exclusions` est créée simultanément
- `statut = 'parti'` → l'entrée dans `departs` est créée simultanément
