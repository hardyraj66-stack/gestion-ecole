# EleveContext

**Fichier source :** `src/contexts/EleveContext.tsx`

Contexte de domaine pour les opérations d'écriture sur les élèves.

---

## Interface du contexte

```typescript
interface EleveContextType {
  create: (data: CreateEleveDto) => Promise<Eleve | null>
  update: (id: string, data: Partial<Eleve>) => Promise<Eleve | null>
  setStatut: (id: string, statut: EleveStatut, details?: StatutDetails) => Promise<boolean>
}
```

---

## Méthodes

### create(data)
- `POST /eleves`
- Body : `{ nom, prenom, date_naissance, genre, classe_id, email?, telephone?, adresse?, pere?, mere?, tuteur? }`
- Retourne l'élève créé ou `null`

### update(id, data)
- `PATCH /eleves/:id`
- Body : champs partiels de Eleve
- Retourne l'élève mis à jour ou `null`

### setStatut(id, statut, details?)
- `PATCH /eleves/:id/statut`
- Body : `{ statut, ...details }`
- Gère les transitions : actif → exclu, actif → parti
- `details` contient les infos de l'exclusion ou du départ (raison, date, etc.)
- Retourne `true` si succès

---

## Événements Socket.IO écoutés

```typescript
onEvent('eleve:created', () => notifyDataChange('eleves'))
onEvent('eleve:updated', () => notifyDataChange('eleves'))
```

---

## Dépendances

- `src/config/api.ts`
- `src/services/socketService.ts`
