import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson, repoRoute } from './githubUtils';
import { useLang } from '../i18n/LanguageContext';
import './GitHub.css';

// Section "Projets épinglés sur GitHub" de la page Projets
function PinnedRepos() {
  const [repos, setRepos] = useState(null);
  const [error, setError] = useState(null);
  const { lang, t } = useLang();

  useEffect(() => {
    fetchJson('/api/github/pinned')
      .then((data) => setRepos(data.repos || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="gh-pinned-section">
      <div className="projects-header">
        <h2>{t('pinned.title')}</h2>
        {repos && <span className="project-count">{t('pinned.count', { n: repos.length })}</span>}
      </div>

      {!repos && !error && <div className="state-container"><div className="loader"></div>{t('pinned.loading')}</div>}
      {error && (
        <p className="gh-pinned-error">
          {t('pinned.unavailable')}{' '}
          <a href="https://github.com/iyadhadife" target="_blank" rel="noopener noreferrer">github.com/iyadhadife ↗</a>
          <span className="gh-pinned-error-detail">({error})</span>
        </p>
      )}

      {repos && (
        <div className="projects-grid">
          {repos.map((r) => (
            <Link to={repoRoute(r.owner, r.name)} key={`${r.owner}/${r.name}`} className="project-card gh-pinned-card">
              <div className="card-content">
                <div className="card-top-row">
                  <span className="project-category">
                    {r.language && <span className="gh-lang-dot" style={{ background: r.languageColor || 'var(--accent)' }} />}
                    {r.language || 'GitHub'}
                  </span>
                  <span className="gh-pinned-stats">
                    {r.pinned && <span className="gh-pinned-badge">{t('pinned.badge')}</span>}★ {r.stars}
                  </span>
                </div>
                <h3>{r.name.replace(/[-_]/g, ' ')}</h3>
                <p>{(lang === 'fr' && r.description_fr) || r.description || t('pinned.noDescription')}</p>
                {r.topics?.length > 0 && (
                  <div className="tech-stack">
                    {r.topics.slice(0, 3).map((topic) => <span key={topic} className="tech-pill">{topic}</span>)}
                    {r.topics.length > 3 && <span className="tech-pill">+</span>}
                  </div>
                )}
              </div>
              <div className="card-footer">
                <span className="view-details-text">{t('pinned.open')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default PinnedRepos;
