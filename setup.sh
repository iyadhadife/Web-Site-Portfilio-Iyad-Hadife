#!/bin/bash

# Arrêter le script si une commande échoue
set -e

echo "🚀 Création du projet iyad-portfolio..."
mkdir -p iyad-portfolio
cd iyad-portfolio

# ==========================================
# 1. BACKEND (Flask)
# ==========================================
echo "🐍 Génération du backend (Flask)..."
mkdir -p backend

cat << 'EOF' > backend/app.py
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
EOF

cat << 'EOF' > backend/requirements.txt
Flask==3.0.0
flask-cors==4.0.0
EOF

# ==========================================
# 2. FRONTEND (React / Vite)
# ==========================================
echo "⚛️ Initialisation du frontend (React/Vite)... cela peut prendre quelques secondes."
# L'option --yes permet de passer les prompts de confirmation de npm
npx --yes create-vite@latest frontend --template react

echo "✍️ Injection du code React et du CSS..."
cat << 'EOF' > frontend/src/App.jsx
import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Assure-toi que Flask est lancé sur le port 5000 !", err))

    fetch('http://localhost:5000/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error("Assure-toi que Flask est lancé sur le port 5000 !", err))
  }, [])

  if (!profile) return <div className="loading">Chargement... (N'oublie pas de lancer le serveur Flask en parallèle)</div>

  return (
    <div className="portfolio-container">
      <header className="header">
        <h1>{profile.name}</h1>
        <h2>{profile.title}</h2>
        <p>{profile.about}</p>
        
        <div className="skills">
          {profile.skills.map(skill => (
            <span key={skill} className="skill-badge">{skill}</span>
          ))}
        </div>
      </header>

      <main className="main-content">
        <h3>Projets Récents</h3>
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <h4>{project.title}</h4>
              <p>{project.description}</p>
              <div className="tech-stack">
                {project.technologies.map(tech => (
                  <span key={tech} className="tech-badge">{tech}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
EOF

cat << 'EOF' > frontend/src/App.css
.portfolio-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  color: #242424;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eaeaea;
}

.header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.header h2 {
  font-size: 1.4rem;
  color: #646cff;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1.5rem;
}

.skill-badge {
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.project-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.project-card h4 {
  margin-top: 0;
  font-size: 1.25rem;
  color: #111;
}

.project-card p {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.6;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.2rem;
}

.tech-badge {
  background-color: #f3f4f6;
  color: #374151;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.loading {
  text-align: center;
  margin-top: 20vh;
  font-size: 1.2rem;
  color: #666;
}
EOF

# ==========================================
# 3. MESSAGE DE FIN
# ==========================================
echo ""
echo "✅ Structure générée avec succès !"
echo "================================================="
echo "Pour démarrer ton portfolio, ouvre 2 terminaux :"
echo ""
echo "🟢 TERMINAL 1 (Backend - Flask) :"
echo "  cd iyad-portfolio/backend"
echo "  python3 -m venv venv"
echo "  source venv/bin/activate    # Ou 'venv\\Scripts\\activate' sous Windows"
echo "  pip install -r requirements.txt"
echo "  python app.py"
echo ""
echo "🔵 TERMINAL 2 (Frontend - React) :"
echo "  cd iyad-portfolio/frontend"
echo "  npm install"
echo "  npm run dev"
echo "================================================="