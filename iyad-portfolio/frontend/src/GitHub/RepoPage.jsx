import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MarkdownView from './MarkdownView';
import FileViewer from './FileViewer';
import { dirname, fetchJson, formatSize, repoRoute } from './githubUtils';
import { useLang } from '../i18n/LanguageContext';
import './GitHub.css';

// Arborescence repliable du dépôt (barre latérale)
function TreeNode({ node, owner, repo, currentPath, depth }) {
  const { t } = useLang();
  const isOnPath = currentPath === node.path || currentPath.startsWith(`${node.path}/`);
  const [open, setOpen] = useState(isOnPath);

  useEffect(() => {
    if (isOnPath) setOpen(true);
  }, [isOnPath]);

  const style = { paddingLeft: `${depth * 14 + 8}px` };

  if (node.type === 'file') {
    return (
      <Link
        to={repoRoute(owner, repo, 'blob', node.path)}
        className={`gh-tree-item ${currentPath === node.path ? 'active' : ''}`}
        style={style}
        title={node.path}
      >
        <span className="gh-tree-icon">📄</span>{node.name}
      </Link>
    );
  }

  return (
    <>
      <div className={`gh-tree-item gh-tree-dir ${currentPath === node.path ? 'active' : ''}`} style={style}>
        <button type="button" className="gh-tree-toggle" onClick={() => setOpen(!open)} aria-label={open ? t('repo.collapse') : t('repo.expand')}>
          {open ? '▾' : '▸'}
        </button>
        <Link to={repoRoute(owner, repo, 'tree', node.path)} onClick={() => setOpen(true)} title={node.path}>
          <span className="gh-tree-icon">📁</span>{node.name}
        </Link>
      </div>
      {open && node.children.map((child) => (
        <TreeNode key={child.path} node={child} owner={owner} repo={repo} currentPath={currentPath} depth={depth + 1} />
      ))}
    </>
  );
}

const sortNodes = (a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1);

const buildTree = (entries) => {
  const root = { path: '', type: 'dir', children: [] };
  const dirs = { '': root };
  [...entries].sort((a, b) => a.path.localeCompare(b.path)).forEach((entry) => {
    const node = { ...entry, name: entry.path.split('/').pop(), children: [] };
    if (entry.type === 'dir') dirs[entry.path] = node;
    (dirs[dirname(entry.path)] || root).children.push(node);
  });
  Object.values(dirs).forEach((dir) => dir.children.sort(sortNodes));
  return root;
};

function Breadcrumb({ owner, repo, path }) {
  const parts = path ? path.split('/') : [];
  return (
    <div className="gh-breadcrumb">
      <Link to={repoRoute(owner, repo, 'tree')}>{repo}</Link>
      {parts.map((part, i) => {
        const subPath = parts.slice(0, i + 1).join('/');
        return (
          <React.Fragment key={subPath}>
            <span className="gh-breadcrumb-sep">/</span>
            {i === parts.length - 1 ? <span>{part}</span> : <Link to={repoRoute(owner, repo, 'tree', subPath)}>{part}</Link>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function RepoPage() {
  const params = useParams();
  const { owner, repo } = params;
  const splat = params['*'] || '';
  const [mode, ...rest] = splat.split('/');
  const requestedView = mode === 'tree' || mode === 'blob' ? mode : 'readme';
  const currentPath = requestedView === 'readme' ? '' : rest.join('/');

  const [info, setInfo] = useState(null);
  const [readme, setReadme] = useState(null);
  const [tree, setTree] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang, t } = useLang();

  useEffect(() => {
    setInfo(null);
    setReadme(null);
    setTree(null);
    setError(null);
    fetchJson(`/api/github/repos/${owner}/${repo}`).then(setInfo).catch((err) => setError(err.message));
    fetchJson(`/api/github/repos/${owner}/${repo}/readme`).then(setReadme).catch(() => setReadme({ html: '' }));
  }, [owner, repo]);

  // L'arborescence n'est chargée qu'à la première ouverture de l'onglet Fichiers
  useEffect(() => {
    if (requestedView === 'readme' || tree) return;
    fetchJson(`/api/github/repos/${owner}/${repo}/tree`).then(setTree).catch((err) => setError(err.message));
  }, [owner, repo, requestedView, tree]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [splat]);

  const entriesByPath = useMemo(() => {
    const map = new Map();
    (tree?.entries || []).forEach((e) => map.set(e.path, e));
    return map;
  }, [tree]);

  // Un lien de README vers un dossier arrive en "blob" : on bascule sur la vue dossier
  const view = requestedView === 'blob' && entriesByPath.get(currentPath)?.type === 'dir' ? 'tree' : requestedView;

  const isDir = useCallback((path) => !path || entriesByPath.get(path)?.type === 'dir', [entriesByPath]);
  const treeRoot = useMemo(() => buildTree(tree?.entries || []), [tree]);

  const dirNode = useMemo(() => {
    if (view !== 'tree') return null;
    if (!currentPath) return treeRoot;
    const find = (node) => {
      if (node.path === currentPath) return node;
      for (const child of node.children) {
        if (child.type === 'dir' && currentPath.startsWith(`${child.path}/`)) {
          const found = find(child);
          if (found) return found;
        }
      }
      return null;
    };
    return find(treeRoot);
  }, [view, currentPath, treeRoot]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return null;
    return (tree?.entries || []).filter((e) => e.type === 'file' && e.path.toLowerCase().includes(q)).slice(0, 200);
  }, [filter, tree]);

  if (error && !info) {
    return (
      <div className="gh-repo-page">
        <Link to="/projects" className="back-button">{t('common.backToProjects')}</Link>
        <div className="state-container error">{error}</div>
      </div>
    );
  }

  const branch = info?.defaultBranch || readme?.branch || tree?.branch || 'main';
  const dirReadme = dirNode?.children.find((c) => c.type === 'file' && /^readme\.(md|markdown)$/i.test(c.name));

  return (
    <div className="gh-repo-page">
      <Link to="/projects" className="back-button">{t('common.backToProjects')}</Link>

      <header className="gh-repo-header">
        <div className="gh-repo-title-row">
          <h1>
            <span className="gh-repo-owner">{owner} /</span> {repo}
          </h1>
          {info && (
            <a className="gh-external-btn" href={info.url} target="_blank" rel="noopener noreferrer">{t('repo.viewOnGitHub')}</a>
          )}
        </div>
        {info?.description && <p className="gh-repo-description">{(lang === 'fr' && info.description_fr) || info.description}</p>}
        {info && (
          <div className="gh-repo-meta">
            {info.language && (
              <span className="gh-lang"><span className="gh-lang-dot" style={{ background: info.languageColor || 'var(--accent)' }} />{info.language}</span>
            )}
            <span>★ {info.stars}</span>
            <span>⑂ {info.forks}</span>
            <span>⎇ {branch}</span>
            {info.homepage && <a href={info.homepage} target="_blank" rel="noopener noreferrer">{t('repo.homepage')}</a>}
          </div>
        )}
        {info?.topics?.length > 0 && (
          <div className="tech-stack gh-topics">
            {info.topics.map((topic) => <span key={topic} className="tech-pill">{topic}</span>)}
          </div>
        )}
      </header>

      <nav className="gh-tabs">
        <Link to={repoRoute(owner, repo)} className={view === 'readme' ? 'active' : ''}>README</Link>
        <Link to={repoRoute(owner, repo, 'tree')} className={view !== 'readme' ? 'active' : ''}>{t('repo.files')}</Link>
      </nav>

      {view === 'readme' && (
        <section className="gh-panel">
          {!readme && <div className="state-container"><div className="loader"></div>{t('repo.loadingReadme')}</div>}
          {readme && !readme.html && <div className="gh-file-message">{t('repo.noReadme')}</div>}
          {readme?.html && (
            <MarkdownView html={readme.html} owner={owner} repo={repo} branch={branch} baseDir={dirname(readme.path || '')} isDir={isDir} />
          )}
        </section>
      )}

      {view !== 'readme' && (
        <div className="gh-explorer">
          <button type="button" className="gh-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? t('repo.hideTree') : t('repo.showTree')}
          </button>
          <aside className={`gh-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <input
              className="gh-filter"
              type="search"
              placeholder={t('repo.search')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="gh-tree">
              {!tree && <div className="gh-tree-loading">{t('common.loading')}</div>}
              {filtered && filtered.map((e) => (
                <Link key={e.path} to={repoRoute(owner, repo, 'blob', e.path)} className={`gh-tree-item ${currentPath === e.path ? 'active' : ''}`} title={e.path}>
                  <span className="gh-tree-icon">📄</span>{e.path}
                </Link>
              ))}
              {filtered?.length === 0 && <div className="gh-tree-loading">{t('repo.noFile')}</div>}
              {!filtered && treeRoot.children.map((node) => (
                <TreeNode key={node.path} node={node} owner={owner} repo={repo} currentPath={currentPath} depth={0} />
              ))}
            </div>
            {tree?.truncated && <p className="gh-tree-loading">{t('repo.truncated')}</p>}
          </aside>

          <section className="gh-main">
            <Breadcrumb owner={owner} repo={repo} path={currentPath} />

            {view === 'blob' && !tree && <div className="state-container"><div className="loader"></div>{t('repo.loadingFile')}</div>}
            {view === 'blob' && tree && (
              <FileViewer
                owner={owner}
                repo={repo}
                branch={branch}
                path={currentPath}
                size={entriesByPath.get(currentPath)?.size}
                isDir={isDir}
              />
            )}

            {view === 'tree' && !tree && <div className="state-container"><div className="loader"></div>{t('repo.loadingFiles')}</div>}
            {view === 'tree' && tree && !dirNode && <div className="gh-file-message error">{t('repo.dirNotFound')}</div>}
            {view === 'tree' && dirNode && (
              <>
                <div className="gh-dir-list">
                  {currentPath && (
                    <Link to={repoRoute(owner, repo, 'tree', dirname(currentPath))} className="gh-dir-row">
                      <span className="gh-tree-icon">↩</span><span className="gh-dir-name">..</span><span />
                    </Link>
                  )}
                  {dirNode.children.map((child) => (
                    <Link key={child.path} to={repoRoute(owner, repo, child.type === 'dir' ? 'tree' : 'blob', child.path)} className="gh-dir-row">
                      <span className="gh-tree-icon">{child.type === 'dir' ? '📁' : '📄'}</span>
                      <span className="gh-dir-name">{child.name}</span>
                      <span className="gh-dir-size">{child.type === 'file' ? formatSize(child.size) : ''}</span>
                    </Link>
                  ))}
                </div>
                {dirReadme && (
                  <FileViewer owner={owner} repo={repo} branch={branch} path={dirReadme.path} size={dirReadme.size} isDir={isDir} />
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default RepoPage;
