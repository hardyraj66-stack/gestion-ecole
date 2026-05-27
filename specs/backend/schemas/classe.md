# Schéma Mongoose — Classe

**Fichier source :** `server/src/classes/classe.schema.ts`
**Collection MongoDB :** `classes`

---

## Schéma

```typescript
@Schema({ timestamps: true })
class Classe {
  @Prop({ required: true })
  nom: string                  // ex: "6ème A"

  @Prop({ required: true })
  niveau: string               // ex: "6ème"

  @Prop({ required: true })
  annee_scolaire: string       // ex: "2024-2025"

  @Prop({ default: 30 })
  capacite: number

  @Prop({ default: '' })
  salle: string                // nom de la salle (vide si variable)

  @Prop({ enum: ['fixe', 'variable'], default: 'fixe' })
  salle_type: string

  @Prop({ default: true })
  actif: boolean
}
```

---

## Index

```javascript
{ annee_scolaire: 1 }
{ annee_scolaire: 1, actif: 1 }
{ salle: 1, salle_type: 1, actif: 1 }
{ niveau: 1, actif: 1 }
```

---

## Notes importantes

- `salle` est vide (`''`) quand `salle_type = 'variable'`
- `actif` permet de désactiver une classe sans la supprimer
- Toujours filtrée par `annee_scolaire` dans les requêtes de liste
