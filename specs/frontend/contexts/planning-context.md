# PlanningContext

**Fichier source :** `src/contexts/PlanningContext.tsx`

Contexte de domaine pour les opérations d'écriture sur les créneaux de planning.

---

## Interface du contexte

```typescript
interface PlanningContextType {
  create: (data: CreateCreneauDto) => Promise<Creneau | null>
  createWithError: (data: CreateCreneauDto) => Promise<{ creneau?: Creneau; error?: string }>
  update: (id: string, data: Partial<Creneau>) => Promise<Creneau | null>
  delete: (id: string) => Promise<boolean>
}
```

---

## Méthodes

### create(data)
- `POST /planning`
- Body : `{ classe_id, matiere_id, jour, heure_debut, heure_fin, salle, professeur_id? }`
- Retourne le créneau créé ou `null`

### createWithError(data)
- `POST /planning`
- Variante qui retourne l'erreur lisible plutôt que `null`
- Utilisé pour afficher les conflits de salle ou de classe dans l'UI planning
- Retourne : `{ creneau }` si succès, `{ error: string }` si conflit

### update(id, data)
- `PATCH /planning/:id`
- Retourne le créneau mis à jour ou `null`

### delete(id)
- `DELETE /planning/:id`
- Retourne `true` si succès

---

## Événements Socket.IO écoutés

```typescript
onEvent('creneau:created', () => notifyDataChange('planning'))
onEvent('creneau:updated', () => notifyDataChange('planning'))
onEvent('creneau:deleted', () => notifyDataChange('planning'))
```

---

## Dépendances

- `src/config/api.ts`
- `src/services/socketService.ts`
