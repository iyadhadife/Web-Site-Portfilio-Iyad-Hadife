"""
Descriptions Markdown des projets, une par langue.

Les fichiers sont rangés dans project_docs/<id du projet>/<fr|en>.md.
La lecture est publique ; l'import et la suppression demandent d'être connecté en admin.
"""
import json
import os

from flask import Blueprint, jsonify, request, session

docs_bp = Blueprint('project_docs', __name__)

BASE_DIR = os.path.dirname(__file__)
DOCS_DIR = os.path.join(BASE_DIR, 'project_docs')
DATA_FILE = os.path.join(BASE_DIR, 'data.json')
LANGUAGES = ('fr', 'en')
MAX_SIZE = 1_000_000  # 1 Mo


def _project_dir(project_id):
    """Dossier du projet, seulement si le projet existe (empêche d'écrire n'importe où)."""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        ids = {p.get('id') for p in json.load(f).get('projects', [])}
    if project_id not in ids or project_id.startswith('.') or '/' in project_id or '\\' in project_id:
        return None
    return os.path.join(DOCS_DIR, project_id)


def _read(folder, lang):
    path = os.path.join(folder, f'{lang}.md')
    if not os.path.isfile(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


@docs_bp.route('/api/projects/<project_id>/docs', methods=['GET'])
def get_project_doc(project_id):
    """Renvoie la description dans la langue demandée, ou dans l'autre langue à défaut."""
    folder = _project_dir(project_id)
    if not folder:
        return jsonify({"error": "Projet introuvable"}), 404

    lang = request.args.get('lang', 'fr')
    if lang not in LANGUAGES:
        lang = 'fr'
    available = [l for l in LANGUAGES if os.path.isfile(os.path.join(folder, f'{l}.md'))]

    for candidate in [lang] + [l for l in LANGUAGES if l != lang]:
        content = _read(folder, candidate)
        if content is not None:
            return jsonify({"lang": candidate, "markdown": content, "available": available})
    return jsonify({"lang": None, "markdown": None, "available": []})


@docs_bp.route('/api/projects/<project_id>/docs/<lang>', methods=['POST'])
def upload_project_doc(project_id, lang):
    if not session.get('admin'):
        return jsonify({"error": "Connexion admin requise"}), 401
    if lang not in LANGUAGES:
        return jsonify({"error": "Langue invalide"}), 400
    folder = _project_dir(project_id)
    if not folder:
        return jsonify({"error": "Projet introuvable"}), 404

    file = request.files.get('file')
    if not file or not file.filename.lower().endswith(('.md', '.markdown')):
        return jsonify({"error": "Envoyez un fichier .md"}), 400
    raw = file.read(MAX_SIZE + 1)
    if len(raw) > MAX_SIZE:
        return jsonify({"error": "Fichier trop volumineux (1 Mo maximum)"}), 400
    try:
        content = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        return jsonify({"error": "Le fichier doit être encodé en UTF-8"}), 400

    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, f'{lang}.md'), 'w', encoding='utf-8') as f:
        f.write(content)
    return jsonify({"message": "Description importée", "lang": lang}), 201


@docs_bp.route('/api/projects/<project_id>/docs/<lang>', methods=['DELETE'])
def delete_project_doc(project_id, lang):
    if not session.get('admin'):
        return jsonify({"error": "Connexion admin requise"}), 401
    if lang not in LANGUAGES:
        return jsonify({"error": "Langue invalide"}), 400
    folder = _project_dir(project_id)
    if not folder:
        return jsonify({"error": "Projet introuvable"}), 404

    path = os.path.join(folder, f'{lang}.md')
    if os.path.isfile(path):
        os.remove(path)
    return jsonify({"message": "Description supprimée"}), 200
