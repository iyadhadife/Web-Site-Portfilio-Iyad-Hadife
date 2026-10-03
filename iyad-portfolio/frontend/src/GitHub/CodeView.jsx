import React, { useMemo } from 'react';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github-dark.css';
import { getExtension } from './githubUtils';

const LANGUAGE_BY_EXTENSION = {
  py: 'python', js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', json: 'json', yml: 'yaml', yaml: 'yaml',
  sh: 'bash', bash: 'bash', zsh: 'bash', css: 'css', scss: 'scss', html: 'xml', xml: 'xml',
  svg: 'xml', java: 'java', c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cs: 'csharp', go: 'go',
  rs: 'rust', rb: 'ruby', php: 'php', sql: 'sql', r: 'r', kt: 'kotlin', swift: 'swift',
  toml: 'ini', ini: 'ini', cfg: 'ini', env: 'ini', md: 'markdown', dockerfile: 'dockerfile',
};

const MAX_HIGHLIGHT_SIZE = 200_000; // au-delà, la coloration ralentirait la page

export const languageFor = (path) => {
  const name = path.split('/').pop().toLowerCase();
  if (name === 'dockerfile') return 'dockerfile';
  if (name === 'makefile') return 'makefile';
  return LANGUAGE_BY_EXTENSION[getExtension(path)] || 'plaintext';
};

function CodeView({ code, language }) {
  const tooLarge = code.length > MAX_HIGHLIGHT_SIZE;

  const lines = useMemo(() => {
    if (tooLarge) return [];
    let html;
    if (language !== 'plaintext' && hljs.getLanguage(language)) {
      html = hljs.highlight(code, { language, ignoreIllegals: true }).value;
    } else {
      html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    // Découpe ligne par ligne en refermant/rouvrant les <span> ouverts sur plusieurs lignes
    const result = [];
    let open = [];
    for (const line of html.replace(/\n$/, '').split('\n')) {
      const prefix = open.join('');
      const tags = line.match(/<span[^>]*>|<\/span>/g) || [];
      for (const tag of tags) {
        if (tag === '</span>') open.pop();
        else open.push(tag);
      }
      result.push(prefix + line + '</span>'.repeat(open.length));
    }
    return result;
  }, [code, language, tooLarge]);

  if (tooLarge) return <pre className="gh-code gh-code-plain">{code}</pre>;

  return (
    <div className="gh-code">
      <table>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i}>
              <td className="gh-code-num">{i + 1}</td>
              <td className="gh-code-line hljs" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CodeView;
