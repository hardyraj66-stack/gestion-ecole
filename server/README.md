# GestionÉcole — Backend NestJS + MongoDB

## Prérequis

- Node.js 18+
- MongoDB (local ou Atlas)

## Installation

```bash
cd server
npm install
```

## Configuration

Variable d'environnement (optionnelle) :

```
MONGO_URI=mongodb://localhost:27017/gestion-ecole
PORT=3000
```

Par défaut : `mongodb://localhost:27017/gestion-ecole` sur le port `3000`.

## Lancement

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

Au **premier démarrage**, si la base est vide, le seeder insère automatiquement :
- 12 salles
- 15 classes
- 15 matières
- ~350 élèves
- ~2000+ notes
- ~200+ créneaux

Les lancements suivants conservent les données existantes.

## API REST

### Classes — `/classes`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/classes` | Toutes les classes |
| GET | `/classes/:id` | Une classe |
| POST | `/classes` | Créer |
| PATCH | `/classes/:id` | Modifier |
| DELETE | `/classes/:id` | Supprimer |

### Élèves — `/eleves`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/eleves` | Tous les élèves |
| GET | `/eleves/:id` | Un élève |
| POST | `/eleves` | Créer |
| PATCH | `/eleves/:id` | Modifier |
| DELETE | `/eleves/:id` | Supprimer |

### Matières — `/matieres`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/matieres` | Toutes les matières |
| GET | `/matieres/:id` | Une matière |
| POST | `/matieres` | Créer |
| PATCH | `/matieres/:id` | Modifier |
| DELETE | `/matieres/:id` | Supprimer |

### Notes — `/notes`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/notes` | Toutes les notes |
| GET | `/notes/bulletin/:eleveId?trimestre=1` | Bulletin |
| GET | `/notes/:id` | Une note |
| POST | `/notes` | Créer |
| PATCH | `/notes/:id` | Modifier |
| DELETE | `/notes/:id` | Supprimer |

### Planning — `/planning`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/planning` | Tous les créneaux |
| GET | `/planning/:id` | Un créneau |
| POST | `/planning` | Créer |
| PATCH | `/planning/:id` | Modifier |
| DELETE | `/planning/:id` | Supprimer |

### Salles — `/salles`
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/salles` | Toutes les salles |
| GET | `/salles/disponibles?jour=Lundi&heure_debut=08:00&heure_fin=09:00` | Disponibilités |
| GET | `/salles/:id` | Une salle |
| POST | `/salles` | Créer |
| PATCH | `/salles/:id` | Modifier |
| DELETE | `/salles/:id` | Supprimer |

## WebSocket

Tous les événements CRUD sont émis en temps réel via Socket.IO :

```
classe:created / classe:updated / classe:deleted
eleve:created / eleve:updated / eleve:deleted
matiere:created / matiere:updated / matiere:deleted
note:created / note:updated / note:deleted
creneau:created / creneau:updated / creneau:deleted
salle:created / salle:updated / salle:deleted
```

## Stack

- **NestJS 10** — Framework
- **Mongoose 8** — ODM MongoDB
- **Socket.IO 4** — WebSocket temps réel
- **Seeder automatique** — Peuple la base au premier lancement
