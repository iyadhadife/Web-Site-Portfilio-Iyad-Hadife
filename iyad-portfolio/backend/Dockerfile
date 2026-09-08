# Image de base pour Python 3.11
FROM python:3.11-slim

# Définition du répertoire de travail
WORKDIR /app

# Copie des dépendances et installation
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY . .

# Commande de lancement (à ajuster si nécessaire)
CMD ["gunicorn", "-w", "2", "--threads", "2", "-b", "0.0.0.0:5000", "app:app"]