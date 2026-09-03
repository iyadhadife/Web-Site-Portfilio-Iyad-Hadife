cat << 'EOF' > backend/Dockerfile
# Image de base pour Python
FROM python:3.10-slim

# Définition du répertoire de travail
WORKDIR /app

# Copie des dépendances et installation
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY . .

# Commande de lancement (à ajuster si vous utilisez Flask ou FastAPI)
CMD ["python", "app.py"]
EOF

cat << 'EOF' > frontend/Dockerfile
# Étape de build avec Node.js
FROM node:18-alpine as build
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source et build
COPY . .
RUN npm run build

# Étape de production avec Nginx
FROM nginx:alpine
# Copie des fichiers générés par Vite (généralement dans le dossier dist)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000" # Ajustez ce port selon la configuration de votre app.py
    restart: unless-stopped
    environment:
      - ENV=production

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    restart: unless-stopped
    depends_on:
      - backend
EOF

echo "Les fichiers Dockerfile et docker-compose.yml ont été créés avec succès !"