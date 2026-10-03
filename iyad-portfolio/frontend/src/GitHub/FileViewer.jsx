import React, { useEffect, useState } from 'react';
import CodeView, { languageFor } from './CodeView';
import MarkdownView from './MarkdownView';
import NotebookView from './NotebookView';
import {
  IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, dirname, fetchJson, formatSize, getExtension, rawUrl,
} from './githubUtils';

function FileViewer({ owner, repo, branch, path, size, isDir }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const ext = getExtension(path);
  const isMedia = IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext) || ext === 'pdf';
  const raw = rawUrl(owner, repo, branch, path);

  useEffect(() => {
    if (isMedia) return undefined;
    let cancelled = false;
    setFile(null);
    setError(null);
    fetchJson(`/api/github/repos/${owner}/${repo}/file?path=${encodeURIComponent(path)}`)
      .then((data) => !cancelled && setFile(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [owner, repo, path, isMedia]);

  const repoProps = { owner, repo, branch, baseDir: dirname(path), isDir };

  let body;
  if (IMAGE_EXTENSIONS.includes(ext)) {
    body = <div className="gh-media"><img src={raw} alt={path} /></div>;
  } else if (VIDEO_EXTENSIONS.includes(ext)) {
    body = <div className="gh-media"><video src={raw} controls /></div>;
  } else if (ext === 'pdf') {
    body = <div className="gh-file-message">Aperçu PDF indisponible. <a href={raw} target="_blank" rel="noopener noreferrer">Télécharger le fichier</a></div>;
  } else if (error) {
    body = <div className="gh-file-message error">{error}</div>;
  } else if (!file) {
    body = <div className="state-container"><div className="loader"></div>Chargement du fichier...</div>;
  } else if (file.kind === 'markdown') {
    body = <div className="gh-file-markdown"><MarkdownView html={file.html} {...repoProps} /></div>;
  } else if (file.kind === 'text' && ext === 'ipynb') {
    body = <NotebookView source={file.content} {...repoProps} />;
  } else if (file.kind === 'text') {
    body = file.content ? <CodeView code={file.content} language={languageFor(path)} /> : <div className="gh-file-message">Fichier vide</div>;
  } else {
    body = (
      <div className="gh-file-message">
        {file.kind === 'too-large' ? 'Fichier trop volumineux pour être affiché.' : 'Fichier binaire, aperçu indisponible.'}{' '}
        <a href={raw} target="_blank" rel="noopener noreferrer">Télécharger le fichier</a>
      </div>
    );
  }

  return (
    <div className="gh-file">
      <div className="gh-file-header">
        <span className="gh-file-name">{path.split('/').pop()}</span>
        <span className="gh-file-meta">
          {size != null && <span>{formatSize(size)}</span>}
          <a href={raw} target="_blank" rel="noopener noreferrer">Brut</a>
        </span>
      </div>
      {body}
    </div>
  );
}

export default FileViewer;
