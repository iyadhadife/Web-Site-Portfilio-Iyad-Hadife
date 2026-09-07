import json
from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app) 

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio_data():
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "Data file not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ... (imports existants)

@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        projects_list = data.get('projects', [])
        return jsonify({
            "projects": projects_list,
            "count": len(projects_list)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project_by_id(project_id):
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for project in data.get('projects', []):
            if project['id'] == project_id:
                return jsonify(project)
                
        return jsonify({"error": "Projet introuvable"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from flask import request

# --- AJOUTER UN PROJET ---
@app.route('/api/projects', methods=['POST'])
def create_project():
    try:
        new_project = request.json
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if 'projects' not in data:
            data['projects'] = []
            
        # Générer un ID simple basé sur le titre si non fourni
        if 'id' not in new_project or not new_project['id']:
            new_project['id'] = new_project.get('title', 'project').lower().replace(' ', '-')
            
        data['projects'].append(new_project)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Projet ajouté avec succès", "project": new_project}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- AJOUTER UNE COMPÉTENCE ---
@app.route('/api/skills', methods=['POST'])
def create_skill():
    try:
        req_data = request.json
        # Format attendu: { "category": "AI & Machine Learning", "skill": "PyTorch" }
        category_name = req_data.get('category')
        new_skill = req_data.get('skill')
        
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        skills_list = data.get('skills', [])
        found = False
        
        for cat in skills_list:
            if cat.get('category') == category_name:
                if new_skill not in cat['items']:
                    cat['items'].append(new_skill)
                found = True
                break
                
        # Si la catégorie n'existe pas, on la crée
        if not found:
            skills_list.append({
                "category": category_name,
                "items": [new_skill]
            })
            data['skills'] = skills_list
            
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Compétence ajoutée avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/journey', methods=['POST'])
def create_journey():
    try:
        new_item = request.json
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if 'journey' not in data:
            data['journey'] = []
            
        data['journey'].insert(0, new_item) # Ajoute tout en haut de la timeline
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Expérience ajoutée avec succès"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    try:
        updated_data = request.json
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        projects_list = data.get('projects', [])
        found = False
        
        for i, project in enumerate(projects_list):
            if project['id'] == project_id:
                # On fusionne les anciennes données avec les nouvelles pour ne rien perdre
                projects_list[i] = {
                    **project,
                    **updated_data,
                    'id': project_id # Sécurité : on fige l'ID
                }
                found = True
                break
                
        if not found:
            return jsonify({"error": "Projet introuvable"}), 404
            
        # Écriture physique et persistante dans le fichier data.json
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Projet mis à jour avec succès dans le JSON", "project": projects_list[i]}), 200
    except Exception as e:
        print("Erreur backend:", str(e))
        return jsonify({"error": str(e)}), 500

# --- SUPPRIMER UNE COMPÉTENCE OU UNE CATÉGORIE ENTIÈRE ---
@app.route('/api/skills', methods=['DELETE'])
def delete_skill():
    try:
        req_data = request.json
        category_name = req_data.get('category')
        skill_name = req_data.get('skill') # Optionnel : si présent, supprime juste la compétence. Sinon, supprime toute la catégorie.
        
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        skills_list = data.get('skills', [])
        
        if skill_name:
            # Supprimer uniquement la compétence spécifique de la catégorie
            for cat in skills_list:
                if cat.get('category') == category_name:
                    if skill_name in cat['items']:
                        cat['items'].remove(skill_name)
                    break
        else:
            # Supprimer toute la catégorie de compétences
            skills_list = [cat for cat in skills_list if cat.get('category') != category_name]
            data['skills'] = skills_list
            
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Suppression effectuée avec succès"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- SUPPRIMER UNE EXPÉRIENCE PROFESSIONNELLE (JOURNEY) ---
@app.route('/api/journey/<int:index>', methods=['DELETE'])
def delete_journey(index):
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        journey_list = data.get('journey', [])
        if 0 <= index < len(journey_list):
            journey_list.pop(index)
            data['journey'] = journey_list
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            return jsonify({"message": "Expérience supprimée avec succès"}), 200
        else:
            return jsonify({"error": "Index invalide"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        projects_list = data.get('projects', [])
        initial_count = len(projects_list)
        
        # Filtrer la liste pour retirer le projet correspondant
        projects_list = [p for p in projects_list if p.get('id') != project_id]
        
        if len(projects_list) == initial_count:
            return jsonify({"error": "Projet introuvable"}), 404
            
        data['projects'] = projects_list
        
        # Enregistrer de façon persistante dans le fichier JSON
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Projet supprimé avec succès"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/contact', methods=['PUT'])
def update_contact():
    try:
        updated_data = request.json
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        data['contactInfo'] = updated_data
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Informations de contact mises à jour avec succès", "contactInfo": updated_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- AJOUTER UNE ÉDUCATION OU UNE EXPÉRIENCE ---
@app.route('/api/<section>', methods=['POST'])
def add_item(section):
    if section not in ['education', 'experience']:
        return jsonify({"error": "Section invalide"}), 400
    try:
        new_item = request.json
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        data.setdefault(section, []).append(new_item)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({"message": "Ajouté avec succès", "item": new_item}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- SUPPRIMER UNE ÉDUCATION OU UNE EXPÉRIENCE ---
@app.route('/api/<section>/<int:index>', methods=['DELETE'])
def delete_item(section, index):
    if section not in ['education', 'experience']:
        return jsonify({"error": "Section invalide"}), 400
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        items_list = data.get(section, [])
        if 0 <= index < len(items_list):
            items_list.pop(index)
            data[section] = items_list
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            return jsonify({"message": "Supprimé avec succès"}), 200
        else:
            return jsonify({"error": "Index invalide"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- MODIFIER UNE ÉDUCATION OU UNE EXPÉRIENCE ---
@app.route('/api/<section>/<int:index>', methods=['PUT'])
def update_item(section, index):
    if section not in ['education', 'experience']:
        return jsonify({"error": "Section invalide"}), 400
    try:
        updated_item = request.json
        file_path = os.path.join(os.path.dirname(__file__), 'data.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        items_list = data.get(section, [])
        if 0 <= index < len(items_list):
            items_list[index] = updated_item
            data[section] = items_list
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            return jsonify({"message": "Mis à jour avec succès"}), 200
        else:
            return jsonify({"error": "Index invalide"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)