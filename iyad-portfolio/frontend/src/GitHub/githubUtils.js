// Outils partagés pour afficher le contenu des dépôts GitHub dans le portfolio

export const RAW_BASE = 'https://raw.githubusercontent.com';

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif'];
export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov'];

export const getExtension = (path = '') => {
  const name = path.split('/').pop().toLowerCase();
  return name.includes('.') ? name.split('.').pop() : '';
};

export const repoRoute = (owner, repo, kind = '', path = '') => {
  const base = `/github/${owner}/${repo}`;
  if (!kind) return base;
  return path ? `${base}/${kind}/${encodePath(path)}` : `${base}/${kind}`;
};

export const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

export const rawUrl = (owner, repo, branch, path) =>
  `${RAW_BASE}/${owner}/${repo}/${branch}/${encodePath(path)}`;

export const dirname = (path = '') => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');

// Résout un lien relatif ("../docs/a.png", "./b.md", "/src") à partir d'un dossier du dépôt
export const resolveRepoPath = (baseDir, target) => {
  let clean = target;
  try {
    clean = decodeURIComponent(target);
  } catch {
    // on garde le lien tel quel s'il est mal encodé
  }
  const parts = clean.startsWith('/') ? [] : (baseDir ? baseDir.split('/') : []);
  for (const part of clean.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
};

export const isExternalUrl = (url) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url);

// Reconnaît https://github.com/owner/repo/(blob|tree|raw)/branch/path
export const parseGitHubUrl = (url) => {
  const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:\/(blob|tree|raw)\/([^/#?]+)\/?([^#?]*))?\/?(?:[?#].*)?$/i);
  if (!match) return null;
  const [, owner, repo, kind, branch, path] = match;
  return { owner, repo: repo.replace(/\.git$/, ''), kind: kind || '', branch, path: path || '' };
};

export const formatSize = (bytes) => {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export const fetchJson = async (url) => {
  const res = await fetch(url);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // réponse non JSON
  }
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data;
};
