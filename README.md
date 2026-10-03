# Web-Site-Portfilio-Iyad-Hadife

docker-compose down
docker-compose up --build -d
Server name : portfolio-iyad-hadife-ovh

version: '3.8'

services:
  backend:
    build: ./iyad-portfolio/backend
    container_name: portfolio_backend
    restart: always
    expose:
      - "5000"

  frontend:
    build: ./iyad-portfolio/frontend
    container_name: portfolio_frontend
    restart: always
    expose:
      - "80"

  nginx:
    image: nginx:alpine
    container_name: portfolio_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d

## GitHub projects in the portfolio

The **Projects** page lists the repositories pinned on the GitHub profile. Each one opens an in-site page (`/github/<owner>/<repo>`) with its README and a file browser (code with syntax highlighting, Markdown, Jupyter notebooks, images).

The browser never calls GitHub directly: the Flask backend proxies and caches the requests (`iyad-portfolio/backend/github_api.py`, 10 min cache). Optional settings in `iyad-portfolio/backend/.env`:

```
GITHUB_USER=iyadhadife
# Read-only token (fine-grained, public repositories, no permissions needed).
# Recommended: reads the exact pinned list through GraphQL and raises the API limit from 60 to 5000 requests/hour.
GITHUB_TOKEN=github_pat_xxx
# Optional manual list that overrides the pinned detection
# PINNED_REPOS=iyadhadife/tumor_detection,iyadhadife/Sign-Language-Detection
```

Without a token, the pinned repositories are read from the public profile page.

The English descriptions shown on the cards and repository pages come from `iyad-portfolio/backend/project_descriptions.json` (key `owner/repo`). They take priority over the GitHub description; repositories missing from the file fall back to GitHub's.

## Light and dark themes

The site uses a softened Mistral AI orange (`#D9581F`, `#CC6A3D` in dark mode) on white (light theme) or black (dark theme).
The sun/moon switch in the navigation bar changes the theme; the choice is saved in the browser,
and on a first visit the site follows the system setting. All colors are CSS variables defined in
`frontend/src/index.css`, so the palette can be changed in one place.

## French / English

The FR / EN switch in the navigation bar changes the language of the whole site and is remembered in the browser (first visit: the browser language). Interface texts live in `iyad-portfolio/frontend/src/i18n/translations.js`.

The content has two files in `iyad-portfolio/backend/`:

- `data.json`: the French content, the only one to edit (admin edits on the site always go there, so editing is only shown in French).
- `data_en.json`: the English content, **generated automatically**. After every change to `data.json` (from the site, or by hand on the server), the changed texts are machine-translated and `data_en.json` is rewritten.

Translations are kept in `translation_cache.json` (French text → English text), so only new or modified texts are translated. To fix a translation by hand, edit its value there; it is kept as long as the French text does not change.

Translation engine: DeepL when `DEEPL_API_KEY` is set in `iyad-portfolio/backend/.env` (better quality, free up to 500,000 characters per month), otherwise Google Translate through `deep-translator` (no key). If translation fails, the French text is shown until the next change.

## Markdown project descriptions

On a project page, the admin can upload a `.md` file per language (buttons under the title). It is stored in `iyad-portfolio/backend/project_docs/<project id>/<fr|en>.md` and replaces the page description when present. If only one language exists, it is shown in both with a short note. Upload and delete require the admin session (`/admin` login); reading is public.

## HTTPS (SSL certificate)

The site gets a free Let's Encrypt certificate that renews itself.

1. Make sure `iyad-hadife.com` and `www.iyad-hadife.com` have a DNS **A record** pointing to the VPS IP,
   and that ports 80 and 443 are open.
2. On the VPS, run once from the repository root:

   ```bash
   sudo ./init-ssl.sh your@email.com
   ```

   The script keeps only the domains that point to the server, starts nginx in HTTP mode,
   requests the certificate and switches the site to HTTPS (HTTP then redirects to HTTPS).
3. Renewal is automatic: the `certbot` service checks every 12 hours and nginx reloads the
   certificate on its own. Certificates live in `certbot/` (ignored by git).

Without a certificate, nginx simply serves the site over HTTP, so `docker compose up` keeps working.
