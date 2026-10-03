# --- ÉTAPE 1 : Build de l'application React ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- ÉTAPE 2 : Serveur Nginx ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuration nginx : HTTP seul ou HTTPS selon la présence du certificat (voir init-ssl.sh)
COPY nginx/site.conf /etc/nginx/snippets/site.conf
COPY nginx/http.conf nginx/https.conf /etc/nginx/templates-ssl/
COPY nginx/40-choose-ssl.sh /docker-entrypoint.d/40-choose-ssl.sh
RUN chmod +x /docker-entrypoint.d/40-choose-ssl.sh && cp /etc/nginx/templates-ssl/http.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]