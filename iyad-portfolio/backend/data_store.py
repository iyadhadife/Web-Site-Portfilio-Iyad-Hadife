"""
Lecture / écriture des fichiers JSON du portfolio (data.json, data_en.json).

- Si un fichier est absent ou invalide, on lève DataFileError avec un message clair
  (nom du fichier, ligne et colonne de l'erreur) au lieu de renvoyer des données vides :
  le site affiche alors une erreur visible au lieu d'une page vide, et rien n'est écrasé.
- L'écriture passe par un fichier temporaire (jamais de fichier à moitié écrit)
  et garde la version précédente dans <fichier>.bak.
"""
import json
import os
import shutil


class DataFileError(Exception):
    pass


def read_json(path):
    name = os.path.basename(path)
    try:
        # utf-8-sig accepte aussi un fichier enregistré avec un BOM (éditeurs Windows)
        with open(path, 'r', encoding='utf-8-sig') as f:
            text = f.read()
    except FileNotFoundError:
        raise DataFileError(f"{name} est introuvable ({path})") from None
    except (OSError, UnicodeDecodeError) as e:
        raise DataFileError(f"{name} est illisible : {e}") from None
    if not text.strip():
        raise DataFileError(f"{name} est vide")
    if '<<<<<<<' in text and '>>>>>>>' in text:
        raise DataFileError(f"{name} contient des marqueurs de conflit git (<<<<<<< / >>>>>>>)")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise DataFileError(f"{name} n'est pas un JSON valide : {e.msg} (ligne {e.lineno}, colonne {e.colno})") from None
    if not isinstance(data, dict) or not data:
        raise DataFileError(f"{name} ne contient aucune donnée")
    return data


def write_json(path, data, indent=4):
    if not isinstance(data, dict) or not data:
        raise DataFileError(f"Refus d'écrire des données vides dans {os.path.basename(path)}")
    tmp = f'{path}.{os.getpid()}.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
    if os.path.exists(path):
        shutil.copyfile(path, path + '.bak')
    os.replace(tmp, path)
