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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)