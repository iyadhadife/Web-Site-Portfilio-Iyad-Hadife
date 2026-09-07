import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import './About.css';

function About() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const [modalType, setModalType] = useState(null);
  const [targetCategory, setTargetCategory] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  
  const [jRole, setJRole] = useState('');
  const [jCompany, setJCompany] = useState('');
  const [jDesc, setJDesc] = useState('');
  const [jDate, setJDate] = useState('');
  const [jStatus, setJStatus] = useState('Current');

  // États pour le plein écran
  const [isSkillsFullscreen, setIsSkillsFullscreen] = useState(false);
  const [isJourneyFullscreen, setIsJourneyFullscreen] = useState(false);

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
      ? `Voulez-vous supprimer la compétence "${skillName}" ?` 
      : `Voulez-vous supprimer toute la catégorie "${categoryName}" ?`;

    if (window.confirm(message)) {
      fetch('http://localhost:5000/api/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName, skill: skillName })
      }).then(res => {
        if(res.ok) fetchData();
      });
    }
  };

  const handleAddJourneySubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: jRole, company: jCompany, description: jDesc, date: jDate, status: jStatus })
    }).then(res => {
      if(res.ok) {
        setModalType(null);
        setJRole(''); setJCompany(''); setJDesc(''); setJDate('');
        fetchData();
      }
    });
  };

  const handleDeleteJourney = (index) => {
    if (window.confirm("Voulez-vous supprimer cette expérience professionnelle ?")) {
      fetch(`http://localhost:5000/api/journey/${index}`, {
        method: 'DELETE'
      }).then(res => {
        if(res.ok) fetchData();
      });
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
        
        {/* COMPÉTENCES AVEC BOUTON PLEIN ÉCRAN */}
        <section className={`skills-section ${isSkillsFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="skills">
          <div className="section-title-wrapper">
            <h2>TECHNICAL SKILLS</h2>
            <div className="section-header-actions">
              <button 
                className="fullscreen-toggle-btn"
                onClick={() => setIsSkillsFullscreen(!isSkillsFullscreen)}
                title={isSkillsFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isSkillsFullscreen ? "🗗 Réduire" : "⛶ Plein écran"}
              </button>
              {isAdmin && (
                <button 
                  className="inline-add-btn" 
                  title="Ajouter une nouvelle catégorie"
                  onClick={() => { 
                    setTargetCategory('CUSTOM'); 
                    setCustomCategoryName(''); 
                    setNewSkillName(''); 
                    setModalType('skill'); 
                  }}
                >
                  +
                </button>
              )}
            </div>
          </div>

          <div className={isSkillsFullscreen ? "skills-grid-fullscreen" : "skills-grid"}>
            {data.skills.map((skillGroup, index) => (
              <div key={index} className="skill-category zoom-card">
                <div className="category-header-flex">
                  <h3>{skillGroup.category}</h3>
                  <div className="admin-inline-actions">
                    {isAdmin && (
                      <>
                        <button 
                          className="small-plus-btn"
                          title={`Ajouter une compétence à ${skillGroup.category}`}
                          onClick={() => { setTargetCategory(skillGroup.category); setNewSkillName(''); setModalType('skill'); }}
                        >
                          +
                        </button>
                        <button 
                          className="small-trash-btn"
                          title="Supprimer toute la catégorie"
                          onClick={() => handleDeleteSkill(skillGroup.category)}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="pills-container">
                  {skillGroup.items.map((item, i) => (
                    <span key={i} className="skill-pill-editable zoom-pill">
                      {item}
                      {isAdmin && (
                        <button 
                          className="pill-delete-btn" 
                          onClick={() => handleDeleteSkill(skillGroup.category, item)}
                          title="Supprimer cette compétence"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EXPÉRIENCE PRO : FRISE VERTICALE OU HORIZONTALE EN PLEIN ÉCRAN */}
        <section className={`journey-section ${isJourneyFullscreen ? 'fullscreen-overlay-mode' : ''}`} id="contact">
          <div className="section-title-wrapper">
            <h2>PROFESSIONAL JOURNEY</h2>
            <div className="section-header-actions">
              <button 
                className="fullscreen-toggle-btn"
                onClick={() => setIsJourneyFullscreen(!isJourneyFullscreen)}
                title={isJourneyFullscreen ? "Quitter le plein écran" : "Plein écran horizontal"}
              >
                {isJourneyFullscreen ? "🗗 Réduire" : "⛶ Plein écran horizontal"}
              </button>
              {isAdmin && (
                <button 
                  className="inline-add-btn" 
                  title="Ajouter une expérience"
                  onClick={() => setModalType('journey')}
                >
                  +
                </button>
              )}
            </div>
          </div>

          <div className={isJourneyFullscreen ? "timeline-frise-horizontal" : "timeline-frise"}>
            {data.journey.map((item, index) => (
              <div key={index} className={isJourneyFullscreen ? "timeline-h-item zoom-timeline-card" : "timeline-frise-item zoom-timeline-card"}>
                <div className={isJourneyFullscreen ? "timeline-h-dot" : "timeline-frise-dot"} data-status={item.status}></div>
                <div className={isJourneyFullscreen ? "timeline-h-content" : "timeline-frise-content"}>
                  <div className="journey-header-flex">
                    <span className="status-badge">{item.status}</span>
                    {isAdmin && (
                      <button 
                        className="small-trash-btn" 
                        onClick={() => handleDeleteJourney(index)}
                        title="Supprimer cette expérience"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <span className="timeline-date-badge">{item.date}</span>
                  <h4>{item.role} <span className="company-name">@ {item.company}</span></h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {!isJourneyFullscreen && (
            <div className="view-projects-wrapper">
              <Link to="/projects" className="view-projects-btn">
                View Projects →
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* MODALE D'AJOUT */}
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setModalType(null)}>✕</button>
            
            {modalType === 'skill' && (
              <form onSubmit={handleAddSkillSubmit}>
                <h3>{targetCategory === 'CUSTOM' ? "Créer une nouvelle catégorie" : `Ajouter à : ${targetCategory}`}</h3>
                {targetCategory === 'CUSTOM' && (
                  <input type="text" placeholder="Nom de la catégorie" value={customCategoryName} onChange={e => setCustomCategoryName(e.target.value)} required />
                )}
                <input type="text" placeholder="Nom de la compétence" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} required />
                <button type="submit" className="submit-btn">Ajouter</button>
              </form>
            )}

            {modalType === 'journey' && (
              <form onSubmit={handleAddJourneySubmit}>
                <h3>Ajouter une expérience professionnelle</h3>
                <select value={jStatus} onChange={e => setJStatus(e.target.value)}>
                  <option value="Current">Current</option>
                  <option value="Previously">Previously</option>
                  <option value="Graduated">Graduated</option>
                </select>
                <input type="text" placeholder="Rôle" value={jRole} onChange={e => setJRole(e.target.value)} required />
                <input type="text" placeholder="Entreprise" value={jCompany} onChange={e => setJCompany(e.target.value)} required />
                <textarea placeholder="Description" value={jDesc} onChange={e => setJDesc(e.target.value)} required />
                <input type="text" placeholder="Période" value={jDate} onChange={e => setJDate(e.target.value)} required />
                <button type="submit" className="submit-btn">Enregistrer</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default About; // (Note: keep export default About; as it was)