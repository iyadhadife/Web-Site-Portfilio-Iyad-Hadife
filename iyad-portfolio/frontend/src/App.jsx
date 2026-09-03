import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import About from './About/About'; // Ajustez le chemin si nécessaire
import Projects from './Projects/Projects';
import ProjectDetail from './Projects/ProjectDetail';
import './App.css';

// Nouveau composant dédié à la navigation
function Navigation() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    // 1. Si on est sur la page des projets ou d'un détail de projet
    if (location.pathname.includes('/projects')) {
      setActiveSection('projects');
      return;
    }

    // 2. Si on est sur la page d'accueil, on écoute le défilement
    const handleScroll = () => {
      // Liste des IDs des sections de votre page About
      const sections = ['home', 'about', 'skills', 'contact'];
      let currentSection = 'home';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Vérifie si la section occupe le tiers supérieur de l'écran
          if (rect.top <= window.innerHeight / 3 && rect.bottom >= window.innerHeight / 3) {
            currentSection = section;
          }
        }
      }
      setActiveSection(currentSection);
    };

    // Exécuter une fois au chargement, puis à chaque défilement
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    
    // Nettoyage de l'écouteur d'événement
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  return (
    <nav className="top-navbar">
      <Link to="/#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>Home</Link>
      <Link to="/#about" className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}>About</Link>
      <Link to="/#skills" className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}>Skills</Link>
      <Link to="/projects" className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`}>Projects</Link>
      <Link to="/#contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;