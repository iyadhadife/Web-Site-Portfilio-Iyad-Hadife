from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/profile', methods=['GET'])
def get_profile():
    return jsonify({
        "name": "Iyad Hadifé",
        "title": "Ingénieur Data & IA",
        "about": "Étudiant en Master 2 Data & IA à l'ESILV. Passionné par l'IA générative, les GNN appliqués à la 3D et le développement d'architectures Multi-Agents.",
        "skills": ["Python", "PyTorch Geometric", "React", "Flask", "LangChain", "Docker"]
    })

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = [
        {
            "id": 1,
            "title": "Détection d'assemblages 3D - Dassault Systèmes",
            "description": "Extraction de features géométriques sur des assemblages CAO et développement d'une architecture GNN pour la reconnaissance topologique.",
            "technologies": ["PyTorch", "CATIA", "GNN", "Python"]
        },
        {
            "id": 2,
            "title": "Terra Sphere",
            "description": "Assistant vocal IA automatisé pour la gestion des appels clients et la prise de rendez-vous pour des paysagistes.",
            "technologies": ["n8n", "ElevenLabs", "LLMs", "Automatisation"]
        },
        {
            "id": 3,
            "title": "Génération de vidéos Financières DCA",
            "description": "Pipeline automatisé de création de contenu TikTok générant des graphiques de performance financière animés.",
            "technologies": ["Plotly", "yfinance", "Python", "API"]
        }
    ]
    return jsonify(projects)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
