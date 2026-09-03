import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

function About() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/portfolio')
      .then((res) => {
        if (!res.ok) throw new Error("Erreur de connexion au serveur");
        return res.json();
      })
      .then((jsonData) => {
        if (jsonData.error) throw new Error(jsonData.error);
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="state-container"><div className="loader"></div>Chargement des données...</div>;
  if (error) return <div className="state-container error">Erreur : {error}</div>;
  if (!data) return <div className="state-container empty">Aucune donnée disponible.</div>;

  return (
    <div className="about-container">
      {/* SECTION HAUT : PROFIL */}
      <section className="profile-header">
        <div className="profile-image-container">
          {/* Utilisation de l'image existante dans le projet */}
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
            <p className="vision-text">{data.profile.vision}</p>
          </div>
        </div>
      </section>

      {/* SECTION BAS : DEUX COLONNES */}
      <div className="main-content-grid">
        
        {/* COLONNE GAUCHE : COMPÉTENCES */}
        <section id="skills" className="skills-section">
          <h2>TECHNICAL SKILLS</h2>
          <div className="skills-grid">
            {data.skills.map((skillGroup, index) => (
              <div key={index} className="skill-category">
                <h3>{skillGroup.category}</h3>
                <div className="pills-container">
                  {skillGroup.items.map((item, i) => (
                    <span key={i} className="skill-pill">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COLONNE DROITE : PARCOURS */}
        <section className="journey-section">
          <h2>PROFESSIONAL JOURNEY</h2>
          <div className="timeline">
            {data.journey.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot" data-status={item.status}></div>
                <div className="timeline-content">
                  <span className="status-label">{item.status}:</span>
                  <h4>{item.role} - <span className="company-name">[{item.company}]</span></h4>
                  <p>{item.description}</p>
                  <span className="timeline-date">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
          
          <Link to="/projects" className="view-projects-btn">
            View Projects
          </Link>
        </section>
      </div>
    </div>
  );
}

export default About;