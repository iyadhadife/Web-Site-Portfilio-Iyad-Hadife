#!/bin/sh
# Choisit la configuration nginx au démarrage du conteneur :
# HTTPS si un certificat Let's Encrypt existe, sinon HTTP seul.
set -e
CERT=$(ls -d /etc/letsencrypt/live/*/ 2>/dev/null | head -n 1)
if [ -n "$CERT" ] && [ -f "${CERT}fullchain.pem" ]; then
    NAME=$(basename "$CERT")
    sed "s/__CERT_NAME__/$NAME/g" /etc/nginx/templates-ssl/https.conf > /etc/nginx/conf.d/default.conf
    echo "SSL : certificat $NAME trouvé, site servi en HTTPS"
    # Recharge nginx régulièrement pour prendre les certificats renouvelés
    (while sleep 12h; do nginx -s reload; done) >/dev/null 2>&1 &
else
    cp /etc/nginx/templates-ssl/http.conf /etc/nginx/conf.d/default.conf
    echo "SSL : aucun certificat, site servi en HTTP seulement"
fi
