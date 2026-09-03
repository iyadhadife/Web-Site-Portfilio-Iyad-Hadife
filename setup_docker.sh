#!/bin/bash

# Arrêter le script si une commande échoue
set -e

echo "🐳 Configuration de Docker pour le projet..."

# ==========================================
# 1. FICHIERS DOCKER BACKEND
# ==========================================
echo "⚙️  Génération des fichiers Backend..."

cat << 'EOF' > backend/Dockerfile
# Image Python légère
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les dépendances et les installer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code source
COPY . .

# Exposer le port de l'API
EXPOSE 5000

# Lancer Flask en l'exposant sur 0.0.0.0 pour Docker
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
EOF

cat << 'EOF' > backend/.dockerignore
venv/
__pycache__/
*.pyc
.env
EOF

# ==========================================
# 2. FICHIERS DOCKER FRONTEND (Multi-stage)
# ==========================================
echo "🎨 Génération des fichiers Frontend (Node + Nginx)..."

cat << 'EOF' > frontend/Dockerfile
# Étape 1 : Build de l'application avec Node
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur Nginx pour distribuer les fichiers compilés
FROM nginx:alpine
# Copier le build Vite (dossier dist) vers le dossier public de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer le port HTTP par défaut
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

cat << 'EOF' > frontend/.dockerignore
node_modules/
dist/
.env
EOF

# ==========================================
# 3. DOCKER-COMPOSE
# ==========================================
echo "🐙 Génération du docker-compose.yml..."

cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
    ports:
      - "5000:5000"
    volumes:
      # Synchronise le code local avec le conteneur (utile pour le dev)
      - ./backend:/app
    environment:
      - FLASK_APP=app.py
      - FLASK_DEBUG=1
    networks:
      - portfolio-network

  frontend:
    build: 
      context: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - portfolio-network

networks:
  portfolio-network:
    driver: bridge
EOF

echo ""
echo "✅ Conteneurisation prête !"
echo "================================================="
echo "Pour lancer toute l'architecture en un seul coup :"
echo "👉 docker-compose up --build"
echo ""
echo "Une fois lancé :"
echo " - Ton site React sera sur : http://localhost:8080"
echo " - Ton API Flask sera sur  : http://localhost:5000"
echo "================================================="