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

## French / English

The FR / EN switch in the navigation bar changes the language of the whole site and is remembered in the browser (first visit: the browser language). Interface texts live in `iyad-portfolio/frontend/src/i18n/translations.js`. Content from `data.json` uses an optional `<field>_en` next to each French field (for example `intro` / `intro_en`); when it is missing, the French text is shown. When logged in as admin, edits made while the site is in English update the `_en` fields and leave the French text untouched.

## Markdown project descriptions

On a project page, the admin can upload a `.md` file per language (buttons under the title). It is stored in `iyad-portfolio/backend/project_docs/<project id>/<fr|en>.md` and replaces the page description when present. If only one language exists, it is shown in both with a short note. Upload and delete require the admin session (`/admin` login); reading is public.
