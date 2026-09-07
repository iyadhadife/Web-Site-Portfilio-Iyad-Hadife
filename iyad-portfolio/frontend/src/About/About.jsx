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
  
  // Formulaire générique pour Education / Experience
  const [itemRole, setItemRole] = useState('');
  const [itemCompany, setItemCompany] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemDate, setItemDate] = useState('');
  const [itemStatus, setItemStatus] = useState('Current');

  const [isSkillsFullscreen, setIsSkillsFullscreen] = useState(false);
  const [isEduFullscreen, setIsEduFullscreen] = useState(false);
  const [isExpFullscreen, setIsExpFullscreen] = useState(false);

  const fetchData = () => {
    fetch('http://localhost:5000/api/portfolio')
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSkillSubmit = (e) => {
    e.preventDefault();
    const categoryToUse = targetCategory === 'CUSTOM' ? customCategoryName : targetCategory;

    fetch('http://localhost:5000/api/skills', {
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
    const message = skillName 
      ? `Supprimer la compétence "${skillName}" ?` 
      : `Supprimer la catégorie "${categoryName}" ?`;

    if (window.confirm(message)) {
      fetch('http://localhost:5000/api/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName, skill: skillName })
      }).then(res => { if(res.ok) fetchData(); });
    }
  };

  const handleAddItemSubmit = (e, section) => {
    e.preventDefault();
    fetch(`http://localhost:5000/api/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: itemRole, company: itemCompany, description: itemDesc, date: itemDate, status: itemStatus })
    }).then(res => {
      if(res.ok) {
        setModalType(null);
        setItemRole(''); setItemCompany(''); setItemDesc(''); setItemDate('');
        fetchData();
      }
    });
  };

  const handleDeleteItem = (section, index) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet élément ?")) {
      fetch(`http://localhost:5000/api/${section}/${index}`, {
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
        {/* SECTION EXPÉRIENCE PROFESSIONNELLE */}
        <section className={`journey-section ${isExpFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="experience">
          <div className="section-title-wrapper">
            <h2>PROFESSIONAL EXPERIENCE</h2>
            <div className="section-header-actions">
              <button className="fullscreen-toggle-btn" onClick={() => setIsExpFullscreen(!isExpFullscreen)}>
                {isExpFullscreen ? "🗗 Réduire" : "⛶ Plein écran horizontal"}
              </button>
              {isAdmin && (
                <button className="inline-add-btn" onClick={() => setModalType('experience')}>+</button>
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
                    {isAdmin && <button className="small-trash-btn" onClick={() => handleDeleteItem('experience', index)}>🗑️</button>}
                  </div>
                  <span className="timeline-date-badge">{item.date}</span>
                  <h4>{item.role} <span className="company-name">@ {item.company}</span></h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {!isExpFullscreen && !isEduFullscreen && (
            <div className="view-projects-wrapper">
              <Link to="/projects" className="view-projects-btn">View Projects →</Link>
            </div>
          )}
        </section>

        {/* SECTION ÉTUDES / FORMATION */}
        <section className={`journey-section ${isEduFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="education">
          <div className="section-title-wrapper">
            <h2>ACADEMIC EDUCATION</h2>
            <div className="section-header-actions">
              <button className="fullscreen-toggle-btn" onClick={() => setIsEduFullscreen(!isEduFullscreen)}>
                {isEduFullscreen ? "🗗 Réduire" : "⛶ Plein écran horizontal"}
              </button>
              {isAdmin && (
                <button className="inline-add-btn" onClick={() => setModalType('education')}>+</button>
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
                    {isAdmin && <button className="small-trash-btn" onClick={() => handleDeleteItem('education', index)}>🗑️</button>}
                  </div>
                  <span className="timeline-date-badge">{item.date}</span>
                  <h4>{item.role} <span className="company-name">@ {item.company}</span></h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION COMPÉTENCES */}
        <section className={`skills-section ${isSkillsFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="skills">
          <div className="section-title-wrapper">
            <h2>TECHNICAL SKILLS</h2>
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
        </section>
      </div>

      {/* MODALES D'AJOUT */}
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
              <form onSubmit={(e) => handleAddItemSubmit(e, modalType)}>
                <h3>{modalType === 'education' ? "Ajouter une formation" : "Ajouter une expérience pro"}</h3>
                <select value={itemStatus} onChange={e => setItemStatus(e.target.value)}>
                  <option value="Current">Current</option>
                  <option value="Previously">Previously</option>
                  <option value="Graduated">Graduated</option>
                </select>
                <input type="text" placeholder="Rôle / Diplôme" value={itemRole} onChange={e => setItemsRoleState ? null : setItemRole(e.target.value)} /* Correction simple */ onInput={e => setItemRole(e.target.value)} required />
                <input type="text" placeholder="École / Entreprise" onInput={e => setItemCompany(e.target.value)} required />
                <textarea placeholder="Description" onInput={e => setItemDesc(e.target.value)} required />
                <input type="text" placeholder="Période (ex: 2025 - 2026)" onInput={e => setItemDate(e.target.value)} required />
                <button type="submit" className="submit-btn">Enregistrer</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default About;