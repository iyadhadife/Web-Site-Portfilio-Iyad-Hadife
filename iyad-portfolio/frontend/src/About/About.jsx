import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import './About.css';

function About() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const [modalType, setModalType] = useState(null); // 'skill', 'education', 'experience'
  const [targetCategory, setTargetCategory] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  
  // États pour le formulaire d'Éducation / Expérience (Création & Édition)
  const [editingIndex, setEditingIndex] = useState(null); // null = ajout, nombre = index en cours d'édition
  const [itemRole, setItemRole] = useState('');
  const [itemCompany, setItemCompany] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemDate, setItemDate] = useState('');
  const [itemStatus, setItemStatus] = useState('Current');

  const [isSkillsFullscreen, setIsSkillsFullscreen] = useState(false);
  const [isEduFullscreen, setIsEduFullscreen] = useState(false);
  const [isExpFullscreen, setIsExpFullscreen] = useState(false);

  const fetchData = () => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- GESTION COMPÉTENCES ---
  const handleAddSkillSubmit = (e) => {
    e.preventDefault();
    const categoryToUse = targetCategory === 'CUSTOM' ? customCategoryName : targetCategory;

    fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: categoryToUse, skill: newSkillName })
    }).then(res => {
      if(res.ok) {
        setModalType(null);
        setNewSkillName('');
        setCustomCategoryName('');
        setTargetCategory('');
        fetchData();
      }
    });
  };

  const handleDeleteSkill = (categoryName, skillName = null) => {
    const message = skillName ? `Supprimer la compétence "${skillName}" ?` : `Supprimer la catégorie "${categoryName}" ?`;
    if (window.confirm(message)) {
      fetch('/api/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName, skill: skillName })
      }).then(res => { if(res.ok) fetchData(); });
    }
  };

  // --- OUVRIR LA MODALE (AJOUT OU ÉDITION) ---
  const handleOpenAdd = (sectionType) => {
    setEditingIndex(null);
    setItemRole('');
    setItemCompany('');
    setItemDesc('');
    setItemDate('');
    setItemStatus('Current');
    setModalType(sectionType);
  };

  const handleOpenEdit = (sectionType, item, index) => {
    setEditingIndex(index);
    setItemRole(item.role || '');
    setItemCompany(item.company || '');
    setItemDesc(item.description || '');
    setItemDate(item.date || '');
    setItemStatus(item.status || 'Current');
    setModalType(sectionType);
  };

  // --- SOUMISSION FORMULAIRE ÉDUCATION / EXPÉRIENCE (POST ou PUT) ---
  const handleSaveItemSubmit = (e, section) => {
    e.preventDefault();
    const payload = { role: itemRole, company: itemCompany, description: itemDesc, date: itemDate, status: itemStatus };

    const url = editingIndex !== null 
      ? `/api/${section}/${editingIndex}` 
      : `/api/${section}`;
    
    const method = editingIndex !== null ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => {
      if(res.ok) {
        setModalType(null);
        setEditingIndex(null);
        fetchData();
      } else {
        alert("Erreur lors de l'enregistrement.");
      }
    });
  };

  // --- SUPPRESSION ÉDUCATION / EXPÉRIENCE ---
  const handleDeleteItem = (section, index) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet élément ?")) {
      fetch(`/api/${section}/${index}`, {
        method: 'DELETE'
      }).then(res => { if(res.ok) fetchData(); });
    }
  };

  if (loading) return <div className="state-container">Chargement...</div>;

  return (
    <div className="about-container" id="home">
      <section className="profile-header">
        <div className="profile-image-container">
          <img src={data.profile.avatar} alt="Profile" className="profile-image" />
        </div>
        <div className="profile-info">
          <h1>
            <span className="first-name">{data.profile.firstName}</span>
            <br />
            <span className="last-name">{data.profile.lastName}</span>
          </h1>
          <div className="profile-text">
            <p>{data.profile.intro}</p>
          </div>
        </div>
      </section>

      <div className="main-content-grid">
        
        {/* 1. EXPÉRIENCE PROFESSIONNELLE */}
        <section className={`journey-section ${isExpFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="experience">
          <div className="section-title-wrapper">
            <h2>EXPÉRIENCE PROFESSIONNELLE</h2>
            <div className="section-header-actions">
              <button className="fullscreen-toggle-btn" onClick={() => setIsExpFullscreen(!isExpFullscreen)}>
                {isExpFullscreen ? "🗗 Réduire" : "⛶ Plein écran horizontal"}
              </button>
              {isAdmin && (
                <button className="inline-add-btn" onClick={() => handleOpenAdd('experience')} title="Ajouter une expérience">+</button>
              )}
            </div>
          </div>

          <div className={isExpFullscreen ? "timeline-frise-horizontal" : "timeline-frise"}>
            {data.experience?.map((item, index) => (
              <div key={index} className={isExpFullscreen ? "timeline-h-item zoom-timeline-card" : "timeline-frise-item zoom-timeline-card"}>
                <div className={isExpFullscreen ? "timeline-h-dot" : "timeline-frise-dot"} data-status={item.status}></div>
                <div className={isExpFullscreen ? "timeline-h-content" : "timeline-frise-content"}>
                  <div className="journey-header-flex">
                    <span className="status-badge">{item.status}</span>
                    {isAdmin && (
                      <div className="admin-inline-actions">
                        <button className="small-edit-btn" onClick={() => handleOpenEdit('experience', item, index)} title="Modifier">✎</button>
                        <button className="small-trash-btn" onClick={() => handleDeleteItem('experience', index)} title="Supprimer">🗑️</button>
                      </div>
                    )}
                  </div>
                  <span className="timeline-date-badge">{item.date}</span>
                  <h4>{item.role} <span className="company-name">@ {item.company}</span></h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. ACADEMIC EDUCATION */}
        <section className={`journey-section ${isEduFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="education">
          <div className="section-title-wrapper">
            <h2>Formation Académique</h2>
            <div className="section-header-actions">
              <button className="fullscreen-toggle-btn" onClick={() => setIsEduFullscreen(!isEduFullscreen)}>
                {isEduFullscreen ? "🗗 Réduire" : "⛶ Plein écran horizontal"}
              </button>
              {isAdmin && (
                <button className="inline-add-btn" onClick={() => handleOpenAdd('education')} title="Ajouter une formation">+</button>
              )}
            </div>
          </div>

          <div className={isEduFullscreen ? "timeline-frise-horizontal" : "timeline-frise"}>
            {data.education?.map((item, index) => (
              <div key={index} className={isEduFullscreen ? "timeline-h-item zoom-timeline-card" : "timeline-frise-item zoom-timeline-card"}>
                <div className={isEduFullscreen ? "timeline-h-dot" : "timeline-frise-dot"} data-status={item.status}></div>
                <div className={isEduFullscreen ? "timeline-h-content" : "timeline-frise-content"}>
                  <div className="journey-header-flex">
                    <span className="status-badge">{item.status}</span>
                    {isAdmin && (
                      <div className="admin-inline-actions">
                        <button className="small-edit-btn" onClick={() => handleOpenEdit('education', item, index)} title="Modifier">✎</button>
                        <button className="small-trash-btn" onClick={() => handleDeleteItem('education', index)} title="Supprimer">🗑️</button>
                      </div>
                    )}
                  </div>
                  <span className="timeline-date-badge">{item.date}</span>
                  <h4>{item.role} <span className="company-name">@ {item.company}</span></h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. TECHNICAL SKILLS */}
        <section className={`skills-section ${isSkillsFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="skills">
          <div className="section-title-wrapper">
            <h2>Compétences Techniques</h2>
            <div className="section-header-actions">
              <button className="fullscreen-toggle-btn" onClick={() => setIsSkillsFullscreen(!isSkillsFullscreen)}>
                {isSkillsFullscreen ? "🗗 Réduire" : "⛶ Plein écran"}
              </button>
              {isAdmin && (
                <button className="inline-add-btn" onClick={() => { setTargetCategory('CUSTOM'); setModalType('skill'); }}>+</button>
              )}
            </div>
          </div>

          <div className={isSkillsFullscreen ? "skills-grid-fullscreen" : "skills-grid"}>
            {data.skills?.map((skillGroup, index) => (
              <div key={index} className="skill-category zoom-card">
                <div className="category-header-flex">
                  <h3>{skillGroup.category}</h3>
                  {isAdmin && (
                    <div className="admin-inline-actions">
                      <button className="small-plus-btn" onClick={() => { setTargetCategory(skillGroup.category); setModalType('skill'); }}>+</button>
                      <button className="small-trash-btn" onClick={() => handleDeleteSkill(skillGroup.category)}>🗑️</button>
                    </div>
                  )}
                </div>
                <div className="pills-container">
                  {skillGroup.items.map((item, i) => (
                    <span key={i} className="skill-pill-editable zoom-pill">
                      {item}
                      {isAdmin && <button className="pill-delete-btn" onClick={() => handleDeleteSkill(skillGroup.category, item)}>×</button>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!isExpFullscreen && !isEduFullscreen && !isSkillsFullscreen && (
            <div className="view-projects-wrapper">
              <Link to="/projects" className="view-projects-btn">View Projects →</Link>
            </div>
          )}
        </section>
      </div>

      {/* MODALES D'AJOUT / ÉDITION */}
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setModalType(null)}>✕</button>
            
            {modalType === 'skill' && (
              <form onSubmit={handleAddSkillSubmit}>
                <h3>{targetCategory === 'CUSTOM' ? "Nouvelle catégorie" : `Ajouter à : ${targetCategory}`}</h3>
                {targetCategory === 'CUSTOM' && (
                  <input type="text" placeholder="Nom de la catégorie" value={customCategoryName} onChange={e => setCustomCategoryName(e.target.value)} required />
                )}
                <input type="text" placeholder="Nom de la compétence" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} required />
                <button type="submit" className="submit-btn">Ajouter</button>
              </form>
            )}

            {(modalType === 'education' || modalType === 'experience') && (
              <form onSubmit={(e) => handleSaveItemSubmit(e, modalType)}>
                <h3>
                  {editingIndex !== null 
                    ? (modalType === 'education' ? "Modifier la formation" : "Modifier l'expérience") 
                    : (modalType === 'education' ? "Ajouter une formation" : "Ajouter une expérience pro")}
                </h3>
                <select value={itemStatus} onChange={e => setItemStatus(e.target.value)}>
                  <option value="Current">Current</option>
                  <option value="Previously">Previously</option>
                  <option value="Graduated">Graduated</option>
                </select>
                <input type="text" placeholder="Rôle / Diplôme" value={itemRole} onChange={e => setItemRole(e.target.value)} required />
                <input type="text" placeholder="École / Entreprise" value={itemCompany} onChange={e => setItemCompany(e.target.value)} required />
                <textarea placeholder="Description" value={itemDesc} onChange={e => setItemDesc(e.target.value)} rows="4" required />
                <input type="text" placeholder="Période (ex: 2025 - 2026)" value={itemDate} onChange={e => setItemDate(e.target.value)} required />
                <button type="submit" className="submit-btn">
                  {editingIndex !== null ? "Mettre à jour" : "Enregistrer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default About;