# syntax=docker/dockerfile:1
# Image unique servant l'API NestJS + le frontend React (build mono-fichier) +
# Socket.IO, sur le port 3000. Construite en 3 étapes pour garder l'image finale légère.

# ----- 1) Build du frontend (Vite -> dist/index.html mono-fichier) -----
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ----- 2) Build du backend (tsc -> dist/) -----
FROM node:20-alpine AS server-build
WORKDIR /srv
COPY server/package*.json ./
# npm install (et non ci) : le lock ne contient pas encore @nestjs/serve-static
RUN npm install --no-audit --no-fund
COPY server/ ./
RUN npm run build

# ----- 3) Image runtime : dépendances de prod + dist + frontend -----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=server-build /srv/dist ./dist
COPY --from=frontend /fe/dist ./public
EXPOSE 3000
CMD ["node", "dist/main.js"]
