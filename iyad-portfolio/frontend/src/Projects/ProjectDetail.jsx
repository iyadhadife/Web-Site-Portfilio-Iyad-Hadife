import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Projects.css';

function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/projects/${id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Projet introuvable.");
          throw new Error("Erreur serveur.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="state-container"><div className="loader"></div>Chargement du projet...</div>;
  if (error) return (
    <div className="state-container error">
      <p>{error}</p>
      <Link to="/projects" className="back-button">← Retour aux projets</Link>
    </div>
  );

  return (
    <div className="project-detail-page">
      <Link to="/projects" className="back-button">← Retour aux projets</Link>
      
      <div className="project-detail-header">
        <span className="project-category">{project.category}</span>
        <h1>{project.title}</h1>
      </div>

      <div className="project-detail-content">
        <div className="main-description">
          <h3>À propos du projet</h3>
          <p>{project.description}</p>
          
          {project.features && (
            <>
              <h3>Fonctionnalités clés</h3>
              <ul>
                {project.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="tech-sidebar">
          <h3>Technologies utilisées</h3>
          <div className="tech-stack-detail">
            {project.technologies?.map((tech, i) => (
              <span key={i} className="tech-pill">{tech}</span>
            ))}
          </div>
          
          {(project.githubUrl || project.demoUrl) && (
            <div className="project-links">
              {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="action-button">Voir sur GitHub</a>}
              {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noreferrer" className="action-button demo">Démonstration</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;