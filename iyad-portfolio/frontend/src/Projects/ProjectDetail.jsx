import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useLang, localizedKey } from '../i18n/LanguageContext';
import './Projects.css';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("Entrez l'URL de l'image :");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run();
  };

  return (
    <div className="tiptap-toolbar sticky-toolbar">
      <div className="toolbar-group">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><b>B</b></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><i>I</i></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}><s>S</s></button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>H3</button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>1. List</button>
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <button onClick={addImage} title="Insérer une image">🖼️ Image</button>
        <button onClick={addTable} title="Insérer un tableau">📊 Tab</button>
        
        {/* Contrôles de tableau dynamiques */}
        {editor.isActive('table') && (
          <>
            <button onClick={() => editor.chain().focus().addRowAfter().run()} title="Ajouter une ligne en dessous">➕ Ligne</button>
            <button onClick={() => editor.chain().focus().addColumnAfter().run()} title="Ajouter une colonne à droite">➕ Col</button>
            <button onClick={() => editor.chain().focus().deleteRow().run()} title="Supprimer la ligne">❌ Ligne</button>
            <button onClick={() => editor.chain().focus().deleteColumn().run()} title="Supprimer la colonne active">❌ Col</button>
            <button onClick={() => editor.chain().focus().deleteTable().run()} title="Supprimer le tableau">🗑️ Tab</button>
          </>
        )}
      </div>
    </div>
  );
};

function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAdmin } = useAuth();
  const { lang, t, localize } = useLang();
  const [isEditing, setIsEditing] = useState(false);
  const [doc, setDoc] = useState(null); // description Markdown importée (.md)
  const fileInputRef = useRef(null);

  const [headings, setHeadings] = useState([]);
  const contentRef = useRef(null);

  const fetchProject = () => {
    fetch(`/api/projects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(t('projects.notFound'));
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchDoc = () => {
    fetch(`/api/projects/${encodeURIComponent(id)}/docs?lang=${lang}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDoc(data))
      .catch(() => setDoc(null));
  };

  useEffect(() => {
    fetchDoc();
  }, [id, lang]);

  const docHtml = useMemo(
    () => (doc?.markdown ? DOMPurify.sanitize(marked.parse(doc.markdown)) : ''),
    [doc],
  );

  const handleDocUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(md|markdown)$/i.test(file.name)) {
      alert(t('docs.onlyMd'));
      return;
    }
    const form = new FormData();
    form.append('file', file);
    fetch(`/api/projects/${encodeURIComponent(id)}/docs/${lang}`, { method: 'POST', body: form, credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.status);
        fetchDoc();
      })
      .catch((err) => alert(`${t('common.error')} : ${err.message}`));
  };

  const handleDocDelete = () => {
    if (!window.confirm(t('docs.confirmDelete', { lang: t(`lang.${lang}`) }))) return;
    fetch(`/api/projects/${encodeURIComponent(id)}/docs/${lang}`, { method: 'DELETE', credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(res.status);
        fetchDoc();
      })
      .catch((err) => alert(`${t('common.error')} : ${err.message}`));
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      LinkExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: project?.description || '',
    editable: isEditing,
    // Gestion du saut de ligne avec Ctrl + Enter dans les cellules ou blocs
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && event.ctrlKey) {
          view.dispatch(view.state.tr.insertText('\n'));
          return true;
        }
        return false;
      }
    }
  });

  // En anglais, l'éditeur affiche et modifie "description_en"
  useEffect(() => {
    if (editor && project) {
      editor.commands.setContent(localize(project, 'description') || '');
    }
  }, [project, editor, localize]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = contentRef.current;
      if (container) {
        // Ignore les titres masqués (description de l'éditeur quand un .md est affiché)
        const elements = [...container.querySelectorAll('h1, h2, h3')].filter((el) => !el.closest('[hidden]'));
        const list = [];
        elements.forEach((el, index) => {
          const headingId = `heading-${index}`;
          el.id = headingId;
          list.push({
            id: headingId,
            text: el.innerText,
            level: el.tagName.toLowerCase()
          });
        });
        setHeadings(list);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [project, isEditing, editor?.getHTML(), docHtml]);

  const scrollToHeading = (headingId) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = () => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    const updatedProject = { ...project, [localizedKey('description', lang)]: htmlContent };

    fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    }).then((res) => {
      if (res.ok) {
        alert("Modifications enregistrées avec succès !");
        setIsEditing(false);
        fetchProject();
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    });
  };

  if (loading) return <div className="state-container"><div className="loader"></div>{t('common.loading')}</div>;
  if (error) return <div className="state-container error"><p>{error}</p><Link to="/projects" className="back-button">{t('common.back')}</Link></div>;

  const showDoc = Boolean(docHtml) && !isEditing;

  return (
    <div className="project-detail-page">
      <div className="detail-top-nav">
        <Link to="/projects" className="back-button">{t('common.backToProjects')}</Link>
      </div>

      <div className="project-detail-header">
        <span className="project-category">{localize(project, 'category')}</span>
        
        <div className="project-title-row">
          <h1>{localize(project, 'title')}</h1>
          {isAdmin && (
            <div className="admin-actions-flex">
              {!isEditing ? (
                <button className="edit-mode-btn" onClick={() => setIsEditing(true)}>{t('projects.edit')}</button>
              ) : (
                <button className="save-changes-btn" onClick={handleSave}>💾 Save</button>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="doc-admin-bar">
            <span className="doc-admin-label">{t('docs.title')}</span>
            <button type="button" className="edit-mode-btn" onClick={() => fileInputRef.current?.click()}>
              {doc?.available?.includes(lang) ? t('docs.replace', { lang: lang.toUpperCase() }) : t('docs.upload', { lang: lang.toUpperCase() })}
            </button>
            {doc?.available?.includes(lang) && (
              <button type="button" className="doc-delete-btn" onClick={handleDocDelete}>{t('docs.delete', { lang: lang.toUpperCase() })}</button>
            )}
            <input ref={fileInputRef} type="file" accept=".md,.markdown,text/markdown" hidden onChange={handleDocUpload} />
            {isEditing && <span className="doc-admin-label">{t('projects.editingLang', { lang: t(`lang.${lang}`) })}</span>}
          </div>
        )}
      </div>

      <div className="project-detail-layout">
        <aside className="project-toc-sidebar">
          <h3>{t('projects.toc')}</h3>
          {headings.length === 0 ? (
            <p className="toc-empty">{t('projects.tocEmpty')}</p>
          ) : (
            <ul>
              {headings.map((h) => (
                <li key={h.id} className={`toc-item ${h.level}`}>
                  <button onClick={() => scrollToHeading(h.id)}>
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className={`tiptap-editor-container ${isEditing ? 'editing-active' : ''}`} ref={contentRef}>
          {isEditing && <MenuBar editor={editor} />}

          {showDoc && (
            <>
              {doc.lang !== lang && <p className="doc-fallback-note">{t('docs.fallback', { lang: t(`lang.${doc.lang}`) })}</p>}
              <div className="gh-markdown project-doc" dangerouslySetInnerHTML={{ __html: docHtml }} />
            </>
          )}

          <div className="tiptap-content-wrapper" hidden={showDoc}>
            <EditorContent editor={editor} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProjectDetail; // (Note: keep export default ProjectDetail;)