# ViewingContext

**Fichier source :** `src/contexts/ViewingContext.tsx`

Gère le mode consultation d'une année scolaire archivée. Quand actif, toute l'application bascule en lecture seule sur les données historiques.

---

## Interface du contexte

```typescript
interface ViewingContextType {
  isViewingArchive: boolean        // true quand on consulte une année passée
  viewingLabel: string | null      // ex: "2023-2024"
  snapshot: any | null             // snapshot brut chargé depuis le backend
  viewAnnee: (annee: AnneeScolaire) => Promise<void>  // entrer en mode archive
  exitView: () => void             // revenir au mode live
}
```

---

## Comportement

### viewAnnee(annee)
1. Appelle `GET /read/annees/:id/snapshot` via `readApi.anneeSnapshot(annee.id)`
2. Stocke le snapshot dans `snapshot`
3. Passe `isViewingArchive = true` et `viewingLabel = annee.label`

### exitView()
- Remet `isViewingArchive = false`, `viewingLabel = null`, `snapshot = null`

---

## Impact sur les hooks

`usePageFetch` lit `isViewingArchive` et `viewingLabel` :

```
isViewingArchive = false
  → fetcher() normal (live)

isViewingArchive = true && snapshot && archiveExtractor
  → archiveExtractor(snapshot) — pas d'appel réseau

isViewingArchive = true && pas d'archiveExtractor
  → fetcher() avec viewingLabel injecté dans les params → ?anneeLabel=XXXX
```

---

## Impact sur l'UI

- `ArchiveBanner` s'affiche en haut de chaque page (lit `isViewingArchive`)
- Boutons d'écriture désactivés implicitement si la page respecte `readOnly`
- Les formulaires de création sont inaccessibles (navigation bloquée ou boutons masqués)

---

## Dépendances

- `src/services/readApi.ts` → `anneeSnapshot`
- Consommé via `useViewing()` dans tous les hooks de page
