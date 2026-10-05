"""
Proxy GitHub pour le portfolio : tous les dépôts publics (épinglés en premier), README et navigation dans les fichiers.

Le navigateur n'appelle jamais GitHub directement : le token (optionnel) reste côté serveur
et les réponses sont mises en cache pour rester sous les limites de l'API.

Variables d'environnement (fichier .env) :
- GITHUB_USER   : compte dont on affiche les projets épinglés (défaut : iyadhadife)
- GITHUB_TOKEN  : token en lecture seule (recommandé, passe la limite de 60 à 5000 requêtes/h)
- PINNED_REPOS  : liste manuelle "owner/repo,owner/repo" des dépôts à mettre en avant en premier
"""
import json
import os
import re
import time
import threading

import requests
from flask import Blueprint, jsonify, request

github_bp = Blueprint('github', __name__)

GITHUB_USER = os.getenv("GITHUB_USER", "iyadhadife")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
PINNED_REPOS = os.getenv("PINNED_REPOS", "").strip()

API = "https://api.github.com"
RAW = "https://raw.githubusercontent.com"
CACHE_TTL = 600  # 10 minutes
MAX_FILE_SIZE = 5_000_000  # au-delà, on propose seulement le téléchargement (les notebooks avec images sont lourds)

# Descriptions FR/EN affichées sur le portfolio, prioritaires sur celles de GitHub
DESCRIPTIONS_FILE = os.path.join(os.path.dirname(__file__), "project_descriptions.json")

_cache = {}
_cache_lock = threading.Lock()


class GitHubError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


RETRY_AFTER_ERROR = 60  # en cas d'échec, on ressert l'ancienne valeur et on réessaie dans 1 minute
DISK_CACHE_FILE = os.path.join(os.path.dirname(__file__), "github_cache.json")


def _cached(key, loader, ttl=CACHE_TTL):
    """Cache mémoire. Si GitHub échoue (limite de l'API, réseau...), on ressert la dernière
    valeur connue plutôt que de faire disparaître les projets du site."""
    now = time.time()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]
    try:
        value = loader()
    except Exception:
        if not hit:
            raise
        print(f"GitHub indisponible pour {key}, ancienne version servie")
        with _cache_lock:
            _cache[key] = (now - ttl + RETRY_AFTER_ERROR, hit[1])
        return hit[1]
    with _cache_lock:
        _cache[key] = (now, value)
    return value


def _disk_cache(key, value=None):
    """Copie sur disque de la liste des projets : survit aux redémarrages et sert de secours."""
    try:
        with open(DISK_CACHE_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (OSError, ValueError):
        data = {}
    if value is None:
        return data.get(key)
    data[key] = value
    try:
        tmp = f"{DISK_CACHE_FILE}.{os.getpid()}.tmp"
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
        os.replace(tmp, DISK_CACHE_FILE)
    except OSError as e:
        print("Écriture du cache GitHub impossible :", e)
    return value


def _headers(accept="application/vnd.github+json"):
    headers = {"Accept": accept, "User-Agent": "iyad-portfolio", "X-GitHub-Api-Version": "2022-11-28"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def _get(url, accept="application/vnd.github+json", params=None):
    res = requests.get(url, headers=_headers(accept), params=params, timeout=15)
    if res.status_code == 404:
        raise GitHubError("Introuvable sur GitHub", 404)
    if res.status_code == 429 or (res.status_code == 403 and res.headers.get("X-RateLimit-Remaining") == "0"):
        raise GitHubError("Limite de l'API GitHub atteinte, réessayez plus tard", 503)
    if not res.ok:
        raise GitHubError(f"Erreur GitHub ({res.status_code})")
    return res


def _with_description(repo):
    try:
        with open(DESCRIPTIONS_FILE, 'r', encoding='utf-8') as f:
            descriptions = {k.lower(): v for k, v in json.load(f).items()}
    except (OSError, ValueError):
        descriptions = {}
    custom = descriptions.get(f"{repo['owner']}/{repo['name']}".lower())
    if isinstance(custom, str):
        custom = {"en": custom}
    if not custom:
        return {**repo, "skills": []}
    # "description" en anglais, "description_fr" pour la version française du site ;
    # "skills" : compétences mises en œuvre dans le dépôt (reliées à la section Compétences)
    return {
        **repo,
        "description": custom.get("en") or repo["description"],
        "description_fr": custom.get("fr") or custom.get("en") or repo["description"],
        "skills": custom.get("skills", []),
    }


# --- PROJETS ÉPINGLÉS ---

PINNED_QUERY = """
query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          owner { login }
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          defaultBranchRef { name }
          primaryLanguage { name color }
          repositoryTopics(first: 8) { nodes { topic { name } } }
        }
      }
    }
  }
}
"""


def _pinned_from_graphql():
    res = requests.post(
        f"{API}/graphql",
        json={"query": PINNED_QUERY, "variables": {"login": GITHUB_USER}},
        headers=_headers(),
        timeout=15,
    )
    res.raise_for_status()
    nodes = res.json()["data"]["user"]["pinnedItems"]["nodes"]
    return [{
        "owner": n["owner"]["login"],
        "name": n["name"],
        "description": n.get("description") or "",
        "url": n["url"],
        "homepage": n.get("homepageUrl") or "",
        "stars": n.get("stargazerCount", 0),
        "forks": n.get("forkCount", 0),
        "defaultBranch": (n.get("defaultBranchRef") or {}).get("name", "main"),
        "language": (n.get("primaryLanguage") or {}).get("name"),
        "languageColor": (n.get("primaryLanguage") or {}).get("color"),
        "topics": [t["topic"]["name"] for t in n["repositoryTopics"]["nodes"]],
    } for n in nodes]


def _pinned_names_from_profile():
    """Sans token, la GraphQL n'est pas accessible : on lit la page publique du profil."""
    res = requests.get(f"https://github.com/{GITHUB_USER}", headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
    res.raise_for_status()
    names = []
    for chunk in res.text.split("pinned-item-list-item-content")[1:]:
        match = re.search(r'href="/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)"', chunk)
        if match and match.groups() not in names:
            names.append(match.groups())
    return names


def _user_repos():
    """Tous les dépôts publics du compte en une seule requête (au lieu d'une par dépôt)."""
    def load():
        repos = _get(f"{API}/users/{GITHUB_USER}/repos", params={"sort": "pushed", "per_page": 100}).json()
        now = time.time()
        with _cache_lock:
            for r in repos:
                _cache[f"meta:{r['owner']['login']}/{r['name']}".lower()] = (now, r)
        return repos
    return _cached("user_repos", load)


def _repo_summary(owner, name):
    data = _repo_meta(owner, name)
    return {
        "owner": data["owner"]["login"],
        "name": data["name"],
        "description": data.get("description") or "",
        "url": data["html_url"],
        "homepage": data.get("homepage") or "",
        "stars": data.get("stargazers_count", 0),
        "forks": data.get("forks_count", 0),
        "defaultBranch": data.get("default_branch", "main"),
        "language": data.get("language"),
        "languageColor": None,
        "topics": data.get("topics", []),
    }


def _load_pinned():
    """Dépôts épinglés, dans l'ordre du profil (liste vide si on ne peut pas les déterminer)."""
    if PINNED_REPOS:
        return [tuple(r.strip().split("/", 1)) for r in PINNED_REPOS.split(",") if "/" in r]
    if GITHUB_TOKEN:
        try:
            return [(r["owner"], r["name"]) for r in _pinned_from_graphql()]
        except Exception as e:
            print("GraphQL pinned items indisponible :", e)
    try:
        return _pinned_names_from_profile()
    except Exception as e:
        print("Lecture du profil GitHub impossible :", e)
        return []


def _load_repos():
    """Tous les dépôts publics (hors forks) : les épinglés d'abord, puis les plus récemment mis à jour."""
    pinned = _load_pinned()
    repos = [r for r in _user_repos() if not r.get("fork") and not r.get("private")]
    order = {(o.lower(), n.lower()): i for i, (o, n) in enumerate(pinned)}
    key = lambda r: (r["owner"]["login"].lower(), r["name"].lower())
    repos.sort(key=lambda r: order.get(key(r), len(order)))  # tri stable : l'ordre "récent" est conservé
    result = []
    # Dépôts épinglés d'un autre compte (organisation, contribution) : ajoutés en tête
    own = {key(r) for r in repos}
    for o, n in pinned:
        if (o.lower(), n.lower()) not in own:
            try:
                result.append({**_repo_summary(o, n), "pinned": True})
            except GitHubError as e:
                print(f"Dépôt épinglé {o}/{n} ignoré :", e)
    for r in repos:
        summary = _repo_summary(r["owner"]["login"], r["name"])
        summary["pinned"] = key(r) in order
        result.append(summary)
    return result, ("pinned+all" if order else "all")


def get_pinned():
    def load():
        try:
            repos, source = _load_repos()
        except Exception as e:
            saved = _disk_cache("pinned")
            if saved:
                print("GitHub indisponible, liste des projets reprise du disque :", e)
                return saved["repos"], saved["source"]
            raise
        _disk_cache("pinned", {"repos": repos, "source": source})
        return repos, source
    return _cached("pinned", load)


def _repo_meta(owner, repo):
    return _cached(f"meta:{owner}/{repo}".lower(), lambda: _get(f"{API}/repos/{owner}/{repo}").json())


def _check_allowed(owner, repo):
    """On ne sert que les dépôts du propriétaire du portfolio ou ceux qu'il a épinglés."""
    if owner.lower() == GITHUB_USER.lower():
        return
    pinned, _ = get_pinned()
    if any(p["owner"].lower() == owner.lower() and p["name"].lower() == repo.lower() for p in pinned):
        return
    raise GitHubError("Dépôt non autorisé", 403)


def _clean_path(path):
    path = (path or "").strip("/")
    if any(part in ("..", ".") for part in path.split("/")):
        raise GitHubError("Chemin invalide", 400)
    return path


@github_bp.errorhandler(GitHubError)
def _handle_github_error(e):
    return jsonify({"error": str(e)}), e.status


@github_bp.errorhandler(requests.RequestException)
def _handle_network_error(e):
    return jsonify({"error": "GitHub est injoignable pour le moment"}), 502


# --- ROUTES ---

@github_bp.route('/api/github/pinned', methods=['GET'])
def pinned_repos():
    repos, source = get_pinned()
    return jsonify({"user": GITHUB_USER, "repos": [_with_description(r) for r in repos], "source": source})


@github_bp.route('/api/github/repos/<owner>/<repo>', methods=['GET'])
def repo_info(owner, repo):
    _check_allowed(owner, repo)
    return jsonify(_with_description(_repo_summary(owner, repo)))


@github_bp.route('/api/github/repos/<owner>/<repo>/readme', methods=['GET'])
def repo_readme(owner, repo):
    _check_allowed(owner, repo)
    branch = _repo_meta(owner, repo).get("default_branch", "main")

    def load():
        html = _get(f"{API}/repos/{owner}/{repo}/readme", accept="application/vnd.github.html",
                    params={"ref": branch}).text
        # Le chemin du README est indiqué dans le HTML (data-path), pas besoin d'une 2e requête
        match = re.search(r'data-path="([^"]+)"', html)
        return {"path": match.group(1) if match else "README.md", "branch": branch, "html": html}

    try:
        return jsonify(_cached(f"readme:{owner}/{repo}", load))
    except GitHubError as e:
        if e.status == 404:
            return jsonify({"path": None, "branch": branch, "html": ""})
        raise


@github_bp.route('/api/github/repos/<owner>/<repo>/tree', methods=['GET'])
def repo_tree(owner, repo):
    _check_allowed(owner, repo)
    branch = _repo_meta(owner, repo).get("default_branch", "main")

    def load():
        data = _get(f"{API}/repos/{owner}/{repo}/git/trees/{branch}", params={"recursive": "1"}).json()
        entries = [{
            "path": item["path"],
            "type": "dir" if item["type"] == "tree" else "file",
            "size": item.get("size"),
        } for item in data.get("tree", []) if item["type"] in ("tree", "blob")]
        return {"branch": branch, "truncated": data.get("truncated", False), "entries": entries}

    return jsonify(_cached(f"tree:{owner}/{repo}", load))


@github_bp.route('/api/github/repos/<owner>/<repo>/file', methods=['GET'])
def repo_file(owner, repo):
    """Contenu d'un fichier. Les .md sont rendus en HTML par GitHub, le reste est renvoyé en texte."""
    _check_allowed(owner, repo)
    path = _clean_path(request.args.get("path"))
    if not path:
        raise GitHubError("Chemin manquant", 400)
    branch = _repo_meta(owner, repo).get("default_branch", "main")
    raw_url = f"{RAW}/{owner}/{repo}/{branch}/{path}"

    def load():
        if path.lower().endswith((".md", ".markdown")):
            html = _get(f"{API}/repos/{owner}/{repo}/contents/{path}", accept="application/vnd.github.html",
                        params={"ref": branch}).text
            return {"kind": "markdown", "html": html}

        res = requests.get(raw_url, headers={"User-Agent": "iyad-portfolio"}, timeout=15, stream=True)
        if res.status_code == 404:
            raise GitHubError("Fichier introuvable", 404)
        res.raise_for_status()
        content = res.raw.read(MAX_FILE_SIZE + 1, decode_content=True)
        res.close()
        if len(content) > MAX_FILE_SIZE:
            return {"kind": "too-large"}
        if b"\x00" in content[:8000]:
            return {"kind": "binary"}
        try:
            return {"kind": "text", "content": content.decode("utf-8")}
        except UnicodeDecodeError:
            return {"kind": "binary"}

    result = dict(_cached(f"file:{owner}/{repo}:{path}", load))
    result.update({"path": path, "branch": branch, "rawUrl": raw_url})
    return jsonify(result)
