import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Projects.css';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/projects')
      .then((res) => {
        if (!res.ok) throw new Error("Erreur de récupération des projets.");
        return res.json();
      })
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="state-container"><div className="loader"></div>Chargement des projets...</div>;
  if (error) return <div className="state-container error">Erreur : {error}</div>;
  
  if (projects.length === 0) {
    return (
      <div className="state-container empty">
        <h2>0 projets disponibles</h2>
        <p>Aucun projet n'a été trouvé pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h2>Mes Projets</h2>
        <span className="project-count">{projects.length} projets disponibles</span>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
            <div className="card-content">
              <span className="project-category">{project.category}</span>
              <h3>{project.title}</h3>
              <p>{project.shortDescription}</p>
              
              <div className="tech-stack">
                {project.technologies?.slice(0, 3).map((tech, i) => (
                  <span key={i} className="tech-pill">{tech}</span>
                ))}
                {project.technologies?.length > 3 && <span className="tech-pill">+</span>}
              </div>
            </div>
            <div className="card-footer">
              <span className="view-details-text">Consulter les détails →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Projects;