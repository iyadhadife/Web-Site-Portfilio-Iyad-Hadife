"""
Version anglaise du portfolio.

data.json (français) est la source : chaque fois qu'il change, data_en.json est régénéré
en traduisant automatiquement les textes. Les traductions déjà faites sont gardées dans
translation_cache.json, donc seuls les textes modifiés sont retraduits (et on peut y
corriger une traduction à la main : la clé est le texte français, la valeur l'anglais).

Moteur de traduction :
- DeepL si DEEPL_API_KEY est défini dans .env (meilleure qualité, gratuit jusqu'à 500 000 caractères/mois)
- sinon Google Traduction via la librairie deep-translator (sans clé)
Si la traduction échoue (réseau...), le texte français est gardé et sera retraduit au prochain changement.
"""
import copy
import json
import os
import threading
from html.parser import HTMLParser
from html import escape

BASE_DIR = os.path.dirname(__file__)
FR_FILE = os.path.join(BASE_DIR, 'data.json')
EN_FILE = os.path.join(BASE_DIR, 'data_en.json')
CACHE_FILE = os.path.join(BASE_DIR, 'translation_cache.json')

# Champs de texte à traduire (le reste est copié tel quel : noms, liens, technologies, statut...)
TRANSLATABLE_FIELDS = {'title', 'intro', 'vision', 'role', 'description', 'shortDescription', 'category', 'date', 'features'}
SKIPPED_SECTIONS = {'contactInfo'}

_lock = threading.Lock()


# --- MOTEUR DE TRADUCTION ---

def _translate_batch(texts):
    """Traduit une liste de textes du français vers l'anglais. Lève une exception en cas d'échec."""
    if not texts:
        return []
    deepl_key = os.getenv('DEEPL_API_KEY', '').strip()
    if deepl_key:
        import requests
        host = 'api-free.deepl.com' if deepl_key.endswith(':fx') else 'api.deepl.com'
        res = requests.post(
            f'https://{host}/v2/translate',
            headers={'Authorization': f'DeepL-Auth-Key {deepl_key}'},
            data={'text': texts, 'source_lang': 'FR', 'target_lang': 'EN-US', 'preserve_formatting': '1'},
            timeout=30,
        )
        res.raise_for_status()
        return [t['text'] for t in res.json()['translations']]

    from deep_translator import GoogleTranslator
    translator = GoogleTranslator(source='fr', target='en')
    return [translator.translate(t) if t.strip() else t for t in texts]


# --- TEXTES HTML (descriptions de projets écrites avec l'éditeur) ---

class _HtmlSplitter(HTMLParser):
    """Découpe du HTML en balises (gardées) et morceaux de texte (à traduire)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []  # ('tag', str) ou ('text', str)

    def handle_starttag(self, tag, attrs):
        self.parts.append(('tag', self.get_starttag_text()))

    def handle_startendtag(self, tag, attrs):
        self.parts.append(('tag', self.get_starttag_text()))

    def handle_endtag(self, tag):
        self.parts.append(('tag', f'</{tag}>'))

    def handle_data(self, data):
        self.parts.append(('text', data))


def _is_html(text):
    return '<' in text and '>' in text


def _text_segments(text):
    """Morceaux de texte à traduire dans une valeur (un seul si texte brut, plusieurs si HTML)."""
    if not _is_html(text):
        return [text]
    splitter = _HtmlSplitter()
    splitter.feed(text)
    return [part for kind, part in splitter.parts if kind == 'text' and part.strip()]


def _rebuild(text, translations):
    if not _is_html(text):
        return translations.get(text, text)
    splitter = _HtmlSplitter()
    splitter.feed(text)
    out = []
    for kind, part in splitter.parts:
        if kind == 'tag':
            out.append(part)
        elif part.strip():
            # On garde les espaces autour du texte, que la traduction a tendance à supprimer
            lead = part[:len(part) - len(part.lstrip())]
            trail = part[len(part.rstrip()):]
            out.append(lead + escape(translations.get(part, part).strip(), quote=False) + trail)
        else:
            out.append(escape(part, quote=False))
    return ''.join(out)


# --- PARCOURS DU JSON ---

def _collect(node, key=None, found=None):
    """Liste les textes à traduire dans le JSON français."""
    if found is None:
        found = []
    if isinstance(node, dict):
        for k, v in node.items():
            if k not in SKIPPED_SECTIONS:
                _collect(v, k, found)
    elif isinstance(node, list):
        for item in node:
            _collect(item, key, found)
    elif isinstance(node, str) and key in TRANSLATABLE_FIELDS and node.strip():
        found.extend(_text_segments(node))
    return found


def _apply(node, translations, key=None):
    if isinstance(node, dict):
        return {k: (v if k in SKIPPED_SECTIONS else _apply(v, translations, k)) for k, v in node.items()}
    if isinstance(node, list):
        return [_apply(item, translations, key) for item in node]
    if isinstance(node, str) and key in TRANSLATABLE_FIELDS and node.strip():
        return _rebuild(node, translations)
    return node


def _load_json(path, default):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def _write_json(path, data, indent):
    # Écriture dans un fichier temporaire puis remplacement : jamais de fichier à moitié écrit
    tmp = f'{path}.{os.getpid()}.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
    os.replace(tmp, path)


def sync_english(translate=_translate_batch):
    """Régénère data_en.json à partir de data.json. Renvoie le nombre de textes nouvellement traduits."""
    with _lock:
        fr_data = _load_json(FR_FILE, {})
        cache = _load_json(CACHE_FILE, {})

        segments = list(dict.fromkeys(_collect(fr_data)))
        missing = [s for s in segments if s not in cache]
        translated = 0
        if missing:
            try:
                results = translate(missing)
                for source, result in zip(missing, results):
                    if result:
                        cache[source] = result
                        translated += 1
            except Exception as e:  # le site continue de marcher, en français pour ces textes
                print('Traduction automatique impossible :', e)

        en_data = _apply(copy.deepcopy(fr_data), cache)
        _write_json(EN_FILE, en_data, indent=4)
        # On ne garde dans le cache que les textes encore utilisés
        _write_json(CACHE_FILE, {s: cache[s] for s in segments if s in cache}, indent=2)
        return translated


def english_is_stale():
    try:
        return os.path.getmtime(EN_FILE) < os.path.getmtime(FR_FILE)
    except OSError:
        return True


def sync_in_background():
    threading.Thread(target=sync_english, daemon=True).start()


def load_data(lang):
    """Données du portfolio dans la langue demandée."""
    if lang == 'en':
        if english_is_stale():
            sync_english()
        return _load_json(EN_FILE, {})
    return _load_json(FR_FILE, {})
