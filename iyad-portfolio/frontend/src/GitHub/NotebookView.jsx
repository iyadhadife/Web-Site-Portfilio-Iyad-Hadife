import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import CodeView from './CodeView';
import MarkdownView from './MarkdownView';

const joinSource = (src) => (Array.isArray(src) ? src.join('') : src || '');
const stripAnsi = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');

function CellOutput({ output }) {
  if (output.output_type === 'stream') {
    return <pre className={`nb-output-text ${output.name === 'stderr' ? 'nb-stderr' : ''}`}>{joinSource(output.text)}</pre>;
  }
  if (output.output_type === 'error') {
    return <pre className="nb-output-text nb-stderr">{stripAnsi((output.traceback || []).join('\n'))}</pre>;
  }
  const data = output.data || {};
  for (const type of ['image/png', 'image/jpeg', 'image/gif']) {
    if (data[type]) return <img className="nb-output-img" src={`data:${type};base64,${joinSource(data[type]).trim()}`} alt="Sortie" />;
  }
  if (data['image/svg+xml']) {
    return <div className="nb-output-html" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(joinSource(data['image/svg+xml'])) }} />;
  }
  if (data['text/html']) {
    return <div className="nb-output-html" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(joinSource(data['text/html'])) }} />;
  }
  if (data['text/plain']) return <pre className="nb-output-text">{joinSource(data['text/plain'])}</pre>;
  return null;
}

// Rendu en lecture seule d'un notebook Jupyter (.ipynb)
function NotebookView({ source, ...repoProps }) {
  const notebook = useMemo(() => {
    try {
      return JSON.parse(source);
    } catch {
      return null;
    }
  }, [source]);

  if (!notebook?.cells) return <CodeView code={source} language="json" />;

  const language = notebook.metadata?.kernelspec?.language || notebook.metadata?.language_info?.name || 'python';

  return (
    <div className="nb-view">
      {notebook.cells.map((cell, i) => {
        const text = joinSource(cell.source);
        if (cell.cell_type === 'markdown') {
          return (
            <div key={i} className="nb-cell nb-markdown">
              <MarkdownView html={marked.parse(text)} {...repoProps} />
            </div>
          );
        }
        if (cell.cell_type !== 'code') return null;
        return (
          <div key={i} className="nb-cell nb-code">
            <div className="nb-prompt">[{cell.execution_count ?? ' '}]</div>
            <div className="nb-cell-body">
              <CodeView code={text} language={language} />
              {(cell.outputs || []).map((output, j) => <CellOutput key={j} output={output} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NotebookView;
