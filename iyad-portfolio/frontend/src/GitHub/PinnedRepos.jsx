import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson, repoRoute } from './githubUtils';
import './GitHub.css';

// Section "Projets épinglés sur GitHub" de la page Projets
function PinnedRepos() {
  const [repos, setRepos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJson('/api/github/pinned')
      .then((data) => setRepos(data.repos || []))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return null; // le reste de la page reste utilisable si GitHub est indisponible

  return (
    <section className="gh-pinned-section">
      <div className="projects-header">
        <h2>Projets épinglés sur GitHub</h2>
        {repos && <span className="project-count">{repos.length} dépôts</span>}
      </div>

      {!repos && <div className="state-container"><div className="loader"></div>Chargement des dépôts GitHub...</div>}

      {repos && (
        <div className="projects-grid">
          {repos.map((r) => (
            <Link to={repoRoute(r.owner, r.name)} key={`${r.owner}/${r.name}`} className="project-card gh-pinned-card">
              <div className="card-content">
                <div className="card-top-row">
                  <span className="project-category">
                    {r.language && <span className="gh-lang-dot" style={{ background: r.languageColor || '#00d2ff' }} />}
                    {r.language || 'GitHub'}
                  </span>
                  <span className="gh-pinned-stats">★ {r.stars}</span>
                </div>
                <h3>{r.name.replace(/[-_]/g, ' ')}</h3>
                <p>{r.description || 'Aucune description.'}</p>
                {r.topics?.length > 0 && (
                  <div className="tech-stack">
                    {r.topics.slice(0, 3).map((t) => <span key={t} className="tech-pill">{t}</span>)}
                    {r.topics.length > 3 && <span className="tech-pill">+</span>}
                  </div>
                )}
              </div>
              <div className="card-footer">
                <span className="view-details-text">README & code source →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default PinnedRepos;
