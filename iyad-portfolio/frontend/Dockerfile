# Étape de build avec Node.js (idéal pour React/Vite)
FROM node:22-alpine AS build
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source et build (génère le dossier dist)
COPY . .
RUN npm run build

# Étape de production avec Nginx
FROM nginx:alpine
# Copie des fichiers générés par Vite dans Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]