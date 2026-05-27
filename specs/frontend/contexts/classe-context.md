# ClasseContext

**Fichier source :** `src/contexts/ClasseContext.tsx`

Contexte de domaine pour les opérations d'écriture sur les classes.

---

## Interface du contexte

```typescript
interface ClasseContextType {
  create: (data: CreateClasseDto) => Promise<Classe | null>
  update: (id: string, data: Partial<Classe>) => Promise<Classe | null>
  desactiver: (id: string) => Promise<boolean>
}
```

---

## Méthodes

### create(data)
- `POST /classes`
- Body : `{ nom, niveau, annee_scolaire, capacite, salle, salle_type }`
- Retourne la classe créée ou `null` en cas d'erreur

### update(id, data)
- `PATCH /classes/:id`
- Body : champs partiels de Classe
- Retourne la classe mise à jour ou `null`

### desactiver(id)
- `PATCH /classes/:id/desactiver`
- Retourne `true` si succès

---

## Événements Socket.IO écoutés

```typescript
onEvent('classe:created', () => notifyDataChange('classes'))
onEvent('classe:updated', () => notifyDataChange('classes'))
```

Ces écouteurs permettent la mise à jour en temps réel sur tous les onglets/clients.

---

## Dépendances

- `src/config/api.ts` → `API_BASE_URL`
- `src/services/socketService.ts`
