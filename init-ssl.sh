#!/bin/bash
# Crée le certificat SSL Let's Encrypt (gratuit) pour le site, à lancer une seule fois sur le VPS :
#   sudo ./init-ssl.sh ton@email.com
# Le renouvellement est ensuite automatique (service certbot du docker-compose).
set -e
cd "$(dirname "$0")"

EMAIL="$1"
DOMAINS="${DOMAINS:-iyad-hadife.com www.iyad-hadife.com}"
if [ -z "$EMAIL" ]; then
  echo "Usage : sudo ./init-ssl.sh ton@email.com"
  exit 1
fi

# On ne garde que les domaines qui pointent bien vers ce serveur (sinon Let's Encrypt refuse tout)
MY_IPS=" $(hostname -I) "
ARGS=""
for d in $DOMAINS; do
  IP=$(getent ahostsv4 "$d" | awk 'NR==1{print $1}')
  if [ -n "$IP" ] && [[ "$MY_IPS" == *" $IP "* ]]; then
    echo "✔ $d pointe vers ce serveur ($IP)"
    ARGS="$ARGS -d $d"
  else
    echo "✘ $d ne pointe pas vers ce serveur (${IP:-aucune adresse}) : ignoré"
  fi
done
if [ -z "$ARGS" ]; then
  echo "Aucun domaine ne pointe vers ce serveur : vérifie les DNS (enregistrement A vers $(hostname -I | awk '{print $1}'))."
  exit 1
fi

mkdir -p certbot/conf certbot/www

echo "→ Démarrage du site en HTTP pour la vérification Let's Encrypt"
docker compose up --build -d nginx

echo "→ Demande du certificat"
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot $ARGS \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive

echo "→ Passage en HTTPS"
docker compose restart nginx
docker compose up -d certbot
echo "✔ Terminé : le site est disponible en https://"
