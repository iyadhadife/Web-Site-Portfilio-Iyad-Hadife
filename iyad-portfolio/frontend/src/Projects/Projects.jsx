import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import PinnedRepos from '../GitHub/PinnedRepos';
import './Projects.css';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin: isLoggedIn } = useAuth();
  const { lang, t } = useLang();
  // L'édition se fait en français : la version anglaise est traduite automatiquement
  const isAdmin = isLoggedIn && lang === 'fr';

  // Gestion de la modale (Création ou Édition)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = création, objet = édition

  // Champs du formulaire
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [technologies, setTechnologies] = useState('');

  const fetchProjects = () => {
    fetch(`/api/projects?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, [lang]);

  // Ouvrir la modale pour l'ajout
  const handleOpenAdd = () => {
    setEditingProject(null);
    setTitle('');
    setShortDescription('');
    setDescription('');
    setCategory('');
    setTechnologies('');
    setIsModalOpen(true);
  };

  // Ouvrir la modale pour l'édition d'un projet existant
  const handleOpenEdit = (e, proj) => {
    e.preventDefault(); // Empêche de déclencher le lien de la carte
    setEditingProject(proj);
    setTitle(proj.title || '');
    setShortDescription(proj.shortDescription || '');
    setDescription(proj.description || '');
    setCategory(proj.category || '');
    setTechnologies(proj.technologies ? proj.technologies.join(', ') : '');
    setIsModalOpen(true);
  };

  // Suppression d'un projet
  const handleDeleteProject = (e, projectId, projectTitle) => {
    e.preventDefault(); // Empêche d'ouvrir la page de détail en cliquant sur la poubelle
    if (window.confirm(`Voulez-vous vraiment supprimer le projet "${projectTitle}" ?`)) {
      fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
        .then((res) => {
          if (res.ok) {
            fetchProjects();
          } else {
            alert("Erreur lors de la suppression du projet.");
          }
        });
    }
  };

  // Soumission du formulaire (Ajout ou Modification)
  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = {
      title,
      shortDescription,
      description,
      category,
      technologies: technologies.split(',').map((tech) => tech.trim())
    };

    const url = editingProject 
      ? `/api/projects/${editingProject.id}`
      : '/api/projects';
    
    const method = editingProject ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    })
      .then((res) => {
        if (res.ok) {
          setIsModalOpen(false);
          fetchProjects();
        } else {
          alert("Erreur lors de l'enregistrement");
        }
      });
  };

  if (loading) return <div className="state-container"><div className="loader"></div>{t('projects.loading')}</div>;
  if (error) return <div className="state-container error">{t('common.error')} : {error}</div>;

  return (
    <div className="projects-page">
      <PinnedRepos />

      <div className="projects-header">
        <div className="header-title-flex">
          <h2>{t('projects.title')}</h2>
          {isAdmin && (
            <button className="inline-add-btn" onClick={handleOpenAdd} title="Ajouter un projet">
              +
            </button>
          )}
        </div>
        <span className="project-count">{t('projects.count', { n: projects.length })}</span>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
            <div className="card-content">
              <div className="card-top-row">
                <span className="project-category">{project.category}</span>
                {isAdmin && (
                  <div className="admin-card-actions">
                    <button 
                      className="small-edit-btn" 
                      onClick={(e) => handleOpenEdit(e, project)}
                      title="Modifier le projet"
                    >
                      ✎
                    </button>
                    <button 
                      className="small-trash-btn" 
                      onClick={(e) => handleDeleteProject(e, project.id, project.title)}
                      title="Supprimer le projet"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
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
              <span className="view-details-text">{t('projects.details')}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* MODALE D'AJOUT / MODIFICATION DE PROJET */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            <h3>{editingProject ? "Modifier le projet" : "Ajouter un nouveau projet"}</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <input 
                type="text" 
                placeholder="Titre du projet" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Description courte" 
                value={shortDescription} 
                onChange={(e) => setShortDescription(e.target.value)} 
                required 
              />
              <textarea 
                placeholder="Description détaillée" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows="4" 
                required 
              />
              <input 
                type="text" 
                placeholder="Catégorie (ex: AI & Machine Learning)" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Technologies (séparées par des virgules)" 
                value={technologies} 
                onChange={(e) => setTechnologies(e.target.value)} 
                required 
              />
              <button type="submit" className="submit-btn">
                {editingProject ? "Mettre à jour" : "Créer le projet"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;