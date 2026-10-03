import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, getExtension, isExternalUrl, parseGitHubUrl,
  rawUrl, repoRoute, resolveRepoPath,
} from './githubUtils';

// Affiche du HTML de GitHub (README, .md, cellules de notebook) en réécrivant les liens :
// images relatives -> raw.githubusercontent.com, liens vers le dépôt -> navigation interne au portfolio.
function MarkdownView({ html, owner, repo, branch, baseDir = '', isDir = () => false }) {
  const navigate = useNavigate();

  const content = useMemo(() => {
    const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html || ''), 'text/html');
    const sameRepo = (info) => info && info.owner.toLowerCase() === owner.toLowerCase()
      && info.repo.toLowerCase() === repo.toLowerCase();

    const mediaSrc = (src) => {
      if (!src || src.startsWith('data:')) return src;
      if (!isExternalUrl(src)) return rawUrl(owner, repo, branch, resolveRepoPath(baseDir, src.split(/[?#]/)[0]));
      const info = parseGitHubUrl(src);
      if (info?.path && ['blob', 'raw'].includes(info.kind)) return rawUrl(info.owner, info.repo, info.branch, info.path);
      return src;
    };

    doc.querySelectorAll('img, video, source').forEach((el) => {
      const src = el.getAttribute('src');
      if (src) el.setAttribute('src', mediaSrc(src));
      el.setAttribute('loading', 'lazy');
    });

    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href.startsWith('#')) {
        a.setAttribute('data-anchor', `user-content-${href.slice(1)}`);
        return;
      }
      let target = null;
      if (!isExternalUrl(href)) {
        const path = resolveRepoPath(baseDir, href.split(/[?#]/)[0]);
        target = { path, kind: isDir(path) ? 'tree' : 'blob' };
      } else {
        const info = parseGitHubUrl(href);
        if (sameRepo(info)) target = { path: info.path, kind: info.kind === 'tree' || !info.path ? 'tree' : 'blob' };
      }

      if (!target) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        return;
      }
      // Les liens qui entourent une image ou une vidéo ouvrent le média lui-même
      const ext = getExtension(target.path);
      if (IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext)) {
        a.setAttribute('href', rawUrl(owner, repo, branch, target.path));
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        return;
      }
      const route = target.path ? repoRoute(owner, repo, target.kind, target.path) : repoRoute(owner, repo, 'tree');
      a.setAttribute('href', route);
      a.setAttribute('data-internal', route);
      a.removeAttribute('target');
    });

    return doc.body.innerHTML;
  }, [html, owner, repo, branch, baseDir, isDir]);

  const handleClick = (e) => {
    const link = e.target.closest('a');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const anchor = link.getAttribute('data-anchor');
    if (anchor) {
      e.preventDefault();
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const internal = link.getAttribute('data-internal');
    if (internal) {
      e.preventDefault();
      navigate(internal);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <div className="gh-markdown" onClick={handleClick} dangerouslySetInnerHTML={{ __html: content }} />
  );
}

export default MarkdownView;
