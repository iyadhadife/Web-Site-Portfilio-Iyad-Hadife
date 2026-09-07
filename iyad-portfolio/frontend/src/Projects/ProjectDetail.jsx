import React, { useState, useEffect, useRef } from 'react';
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
        <button onClick={addTable} title="Insérer un tableau">📊 Tableau</button>
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
  const [isEditing, setIsEditing] = useState(false);

  const [headings, setHeadings] = useState([]);
  const contentRef = useRef(null);

  const fetchProject = () => {
    fetch(`http://localhost:5000/api/projects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Projet introuvable.");
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
  });

  useEffect(() => {
    if (editor && project?.description) {
      editor.commands.setContent(project.description);
    }
  }, [project, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = contentRef.current;
      if (container) {
        const elements = container.querySelectorAll('h1, h2, h3');
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
  }, [project, isEditing, editor?.getHTML()]);

  const scrollToHeading = (headingId) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = () => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    const updatedProject = { ...project, description: htmlContent };

    fetch(`http://localhost:5000/api/projects/${id}`, {
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

  if (loading) return <div className="state-container"><div className="loader"></div>Chargement...</div>;
  if (error) return <div className="state-container error"><p>{error}</p><Link to="/projects" className="back-button">← Retour</Link></div>;

  return (
    <div className="project-detail-page">
      <div className="detail-top-nav">
        <Link to="/projects" className="back-button">← Retour aux projets</Link>
      </div>

      <div className="project-detail-header">
        <span className="project-category">{project.category}</span>
        
        {/* Titre et bouton d'édition alignés parfaitement sur la même ligne */}
        <div className="project-title-row">
          <h1>{project.title}</h1>
          {isAdmin && (
            <div className="admin-actions-flex">
              {!isEditing ? (
                <button className="edit-mode-btn" onClick={() => setIsEditing(true)}>✎ Modifier la page</button>
              ) : (
                <button className="save-changes-btn" onClick={handleSave}>💾 Save</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="project-detail-layout">
        <aside className="project-toc-sidebar">
          <h3>Sommaire</h3>
          {headings.length === 0 ? (
            <p className="toc-empty">Aucun titre dans la page</p>
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
          {/* La barre d'outils s'accrochera automatiquement en haut lors du scroll */}
          {isEditing && <MenuBar editor={editor} />}
          
          <div className="tiptap-content-wrapper">
            <EditorContent editor={editor} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProjectDetail;