# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble

Application de gestion scolaire (GestionÉcole) avec un frontend React + Vite et un backend NestJS + MongoDB. Les deux sont des projets Node.js séparés dans le même dépôt.

## Commandes

### Frontend (répertoire racine)
```bash
npm run dev       # Démarrer le serveur Vite
npm run build     # Build (produit un fichier HTML unique via vite-plugin-singlefile)
npm run preview   # Prévisualiser le build de production
```

### Backend (répertoire `server/`)
```bash
cd server
npm run dev       # Démarrer avec nodemon (rechargement à chaud)
npm run build     # Compiler TypeScript
npm start         # Lancer le dist/main.js compilé
npm run seed      # Lancer le seeder manuellement (s'exécute automatiquement au 1er démarrage si la DB est vide)
```

### Lancer les deux
Deux terminaux sont nécessaires : un pour `npm run dev` (frontend sur le port Vite) et un pour `cd server && npm run dev` (backend sur le port 3000).

## Architecture

### Frontend (`src/`)

**Flux de données — séparation inspirée CQRS :**
- **Lectures** : le hook `usePageFetch` (dans `src/hooks/usePageData.ts`) appelle `readApi` (dans `src/services/readApi.ts`), qui interroge les endpoints `/read/*`. Les pages utilisent des hooks spécifiques comme `useClassesListData`, `useBulletinData`, etc.
- **Écritures** : chaque contexte de domaine (ex. `ClasseContext`, `EleveContext`) expose des méthodes `create`, `update`, `delete` qui appellent directement les endpoints REST standards via `fetch`.

**Mises à jour en temps réel :**
Les événements Socket.IO du backend déclenchent `notifyDataChange(channel)` dans `socketService.ts`. Cela provoque un re-fetch silencieux (sans loader plein écran) dans les hooks `usePageFetch` abonnés au canal correspondant.

**Pile de contextes (`src/contexts/AppProviders.tsx`) :**
Tous les contextes de domaine sont empilés dans `AppProviders`. Chaque contexte ne contient que des méthodes d'écriture et des abonnements socket ; les données lisibles vivent dans les hooks `usePageFetch` au niveau des pages. Exception : `ViewingContext` qui contient l'état du snapshot d'archive.

**Mode archive/consultation (`src/contexts/ViewingContext.tsx`) :**
Quand un utilisateur consulte une année scolaire passée, `ViewingContext` charge un snapshot et passe `isViewingArchive = true`. `usePageFetch` et `useData` détectent cela et servent les données du snapshot au lieu des données live, rendant toutes les pages automatiquement en lecture seule.

**`useData` vs `usePageFetch` :**
- `useData` (dans `src/hooks/useData.ts`) est l'ancien hook — récupère toutes les entités d'un coup. Encore utilisé dans les pages qui ont besoin de données multi-entités.
- `usePageFetch` est le pattern préféré et plus récent — récupère uniquement ce dont une page a besoin, avec pagination, recherche et rafraîchissement socket ciblé.

**Alias de chemin :** `@/` pointe vers `src/`.

**Composants UI :**
- `src/components/shared/` — primitives réutilisables de formulaire/mise en page (Button, Input, Select, Table, etc.)
- `src/components/ui/` — blocs UI de niveau supérieur (PageHeader, StatCard, EmptyState, Badge)
- `src/utils/cn.ts` — utilitaire `cn()` combinant `clsx` + `tailwind-merge`

### Backend (`server/src/`)

**Structure des modules NestJS :** Un module par domaine (`classes`, `eleves`, `matieres`, `notes`, `planning`, `salles`, `annees`), chacun avec `schema.ts`, `controller.ts`, `service.ts`, `module.ts`.

**Module Read (`server/src/read/`) :** `ReadController` + `ReadService` dédiés servant tous les endpoints `/read/*`. Ils retournent des objets de vue pré-composés (pagination, données jointes) optimisés pour chaque page frontend. Les schémas dans `read/schemas/` définissent la forme de chaque vue.

**WebSocket (`server/src/events/events.gateway.ts`) :** Une seule gateway Socket.IO. Les services de domaine émettent des événements (`classe:created`, `eleve:updated`, etc.) après chaque mutation.

**Seeder (`server/src/data/seeder.service.ts`) :** S'exécute automatiquement au démarrage si toutes les collections sont vides. Insère 12 salles, 15 classes, 15 matières, ~350 élèves, ~2000 notes, ~200 créneaux.

**Connexion MongoDB :** Par défaut `mongodb://localhost:27017/gestion-ecole` sur le port `3000`. Peut être surchargé via les variables d'environnement `MONGO_URI` et `PORT`.

## Règle de travail

Pendant l'implémentation, ne jamais poser de questions jusqu'à la fin. Toutes les commandes terminal sont autorisées — les exécuter directement sans demander confirmation.

## Conventions importantes

- **Types de salle :** `fixe` (salle fixe assignée à la classe) vs `variable` (salle choisie par créneau de planning). Quand `salle_type` est `variable`, le sélecteur de salle est masqué dans les formulaires de création/édition de classe.
- **Niveaux :** Les niveaux scolaires sont dérivés des données, non codés en dur — récupérés via `/read/niveaux`.
- **Trimestres :** 1, 2 ou 3 — utilisés dans les notes et les bulletins.
- **Pagination :** Tous les endpoints de liste acceptent `page` + `limit` ; les hooks frontend gèrent l'incrémentation de l'état de page.
