import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import About from './About/About'; // Ajustez le chemin si vous l'avez mis dans un dossier 'pages'
import './App.css';
import Projects from './Projects/Projects'; // Ou le dossier approprié
import ProjectDetail from './Projects/ProjectDetail';

function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Barre de navigation inspirée de la maquette */}
        <nav className="top-navbar">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/" className="nav-link active">About</Link>
          <Link to="/#skills" className="nav-link">Skills</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          <Link to="#contact" className="nav-link">Contact</Link>
        </nav>

        {/* Le contenu de la page qui change selon l'URL */}
        <main className="main-content">
          <Routes>
            {/* La page d'accueil affiche le composant About */}
            <Route path="/" element={<About />} />
            
            {/* Vous pourrez décommenter ceci quand vous créerez Projects.jsx */}
            {/* <Route path="/projects" element={<Projects />} /> */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;