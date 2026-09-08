import React, { useState, useEffect } from 'react';
import './Admin.css';

function Admin() {
  const [projects, setProjects] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  
  // États pour le formulaire Projet
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectShortDesc, setProjectShortDesc] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectTechs, setProjectTechs] = useState('');

  // États pour le formulaire Skill
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillCategory, setSkillCategory] = useState('');
  const [skillName, setSkillName] = useState('');

  // Charger les données existantes
  useEffect(() => {
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
        setSkillsData(data.skills || []);
      })
      .catch(err => console.error("Erreur chargement admin", err));
  }, []);

  // Soumission d'un nouveau projet
  const handleAddProject = (e) => {
    e.preventDefault();
    const newProj = {
      title: projectTitle,
      shortDescription: projectShortDesc,
      description: projectDesc,
      category: projectCategory,
      technologies: projectTechs.split(',').map(t => t.trim())
    };

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProj)
    })
    .then(res => {
      if(res.ok) {
        alert("Projet ajouté avec succès !");
        window.location.reload();
      } else {
        alert("Erreur lors de l'ajout");
      }
    });
  };

  // Soumission d'une nouvelle compétence
  const handleAddSkill = (e) => {
    e.preventDefault();
    fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: skillCategory, skill: skillName })
    })
    .then(res => {
      if(res.ok) {
        alert("Compétence ajoutée avec succès !");
        window.location.reload();
      } else {
        alert("Erreur lors de l'ajout");
      }
    });
  };

  return (
    <div className="admin-container">
      <h1>Panneau d'Administration</h1>

      {/* SECTION PROJETS */}
      <div className="admin-section">
        <div className="section-header">
          <h2>Gestion des Projets</h2>
          <button className="add-btn" onClick={() => setShowProjectForm(!showProjectForm)}>
            {showProjectForm ? '✕ Annuler' : '+ Ajouter un projet'}
          </button>
        </div>

        {showProjectForm && (
          <form onSubmit={handleAddProject} className="admin-form">
            <input type="text" placeholder="Titre du projet" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} required />
            <input type="text" placeholder="Description courte" value={projectShortDesc} onChange={e => setProjectShortDesc(e.target.value)} required />
            <textarea placeholder="Description détaillée" value={projectDesc} onChange={e => setProjectDesc(e.target.value)} required />
            <input type="text" placeholder="Catégorie (ex: AI & Machine Learning)" value={projectCategory} onChange={e => setProjectCategory(e.target.value)} required />
            <input type="text" placeholder="Technologies (séparées par des virgules)" value={projectTechs} onChange={e => setProjectTechs(e.target.value)} required />
            <button type="submit" className="submit-btn">Enregistrer le projet</button>
          </form>
        )}
      </div>

      {/* SECTION SKILLS */}
      <div className="admin-section">
        <div className="section-header">
          <h2>Gestion des Compétences</h2>
          <button className="add-btn" onClick={() => setShowSkillForm(!showSkillForm)}>
            {showSkillForm ? '✕ Annuler' : '+ Ajouter une compétence'}
          </button>
        </div>

        {showSkillForm && (
          <form onSubmit={handleAddSkill} className="admin-form">
            <select value={skillCategory} onChange={e => setSkillCategory(e.target.value)} required>
              <option value="">Sélectionner ou écrire une catégorie</option>
              {skillsData.map((s, idx) => (
                <option key={idx} value={s.category}>{s.category}</option>
              ))}
            </select>
            <input type="text" placeholder="Nom de la compétence (ex: PyTorch)" value={skillName} onChange={e => setSkillName(e.target.value)} required />
            <button type="submit" className="submit-btn">Enregistrer la compétence</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Admin;