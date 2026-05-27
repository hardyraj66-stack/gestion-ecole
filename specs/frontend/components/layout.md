# Composants de Layout

**Dossier source :** `src/components/layout/`

---

## Layout

**Fichier :** `Layout.tsx`

Composant racine de mise en page. Contient la sidebar et la zone principale avec `<Outlet />`.

### Structure

```tsx
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    {isViewingArchive && <ArchiveBanner />}
    <Outlet />    {/* pages de React Router */}
  </main>
</div>
```

### Comportement
- Lit `isViewingArchive` depuis `ViewingContext` pour afficher `ArchiveBanner`
- Le layout est fixe (sidebar non rétractable sur desktop)
- Scroll vertical dans le `<main>` uniquement

---

## Sidebar

**Fichier :** `Sidebar.tsx`

Navigation latérale de l'application.

### Structure

```
Logo (BrandIcon + BrandWordmark)

Navigation principale:
  ├─ Dashboard (icône house)
  ├─ Classes
  ├─ Élèves
  ├─ Matières
  ├─ Notes
  ├─ Planning
  ├─ Salles
  ├─ Niveaux
  ├─ Professeurs
  ├─ Évaluations
  └─ Année scolaire

En bas:
  └─ Paramètres
```

### Comportement
- Chaque lien utilise `<NavLink>` (React Router) — classe active automatique
- Lien actif : fond coloré avec `--color-primary`
- Affiche les icônes + labels (via `Icon` component)
- Traduit via `useTranslation()` (i18n)

---

## ArchiveBanner

**Fichier :** `ArchiveBanner.tsx`

Bandeau d'alerte affiché en haut de page quand l'utilisateur consulte une archive.

### Props

```typescript
interface ArchiveBannerProps {
  anneeLabel: string    // ex: "2023-2024"
}
```

### Structure

```
[📁 Mode consultation — Année 2023-2024 — Données en lecture seule]  [Quitter]
```

### Comportement
- Fond orange/ambre distinct
- Bouton "Quitter" → `ViewingContext.exitView()` puis navigation vers `/dashboard`
- Non interactif sur les données (il n'empêche pas la navigation)

---

## Dépendances

- `src/contexts/ViewingContext.tsx`
- `src/components/brand/BrandIcon.tsx`
- `src/components/brand/BrandWordmark.tsx`
- `src/components/shared/Icon.tsx`
- `react-router-dom` → `NavLink`, `useNavigate`, `Outlet`
