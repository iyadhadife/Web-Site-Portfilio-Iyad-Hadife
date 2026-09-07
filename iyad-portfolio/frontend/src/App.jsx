import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import About from './About/About';
import Contact from './Contact/Contact';
import Projects from './Projects/Projects';
import ProjectDetail from './Projects/ProjectDetail';
import AdminLogin from './Admin/AdminLogin';
import './App.css';

function Navigation() {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    // 1. Si on est sur l'onglet projets
    if (location.pathname.includes('/projects')) {
      setActiveSection('projects');
      return;
    }

    // 2. Si on revient sur la page d'accueil (chemin "/")
    if (location.pathname === '/') {
      // Si une ancre est présente dans l'URL (ex: /#skills), on l'active, sinon 'home'
      if (location.hash === '#skills') {
        setActiveSection('skills');
      } else {
        setActiveSection('home');
      }
    }

    // 3. Écouteur de défilement pour la page d'accueil
    const handleScroll = () => {
      if (location.pathname !== '/') return;
      
      const sections = ['home', 'skills', 'contact'];
      let currentSection = 'home';
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 3 && rect.bottom >= window.innerHeight / 3) {
            currentSection = section;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Exécuter au chargement

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  return (
    <nav className="top-navbar">
      <Link to="/#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>Home</Link>
      <Link to="/#skills" className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}>Skills</Link>
      <Link to="/projects" className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`}>Projects</Link>
      <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
      {isAdmin ? (
        <button onClick={logout} className="nav-link admin-logout-btn" style={{background:'none', border:'none', cursor:'pointer'}}>Déconnexion</button>
      ) : (
        <Link to="/admin" className="nav-link admin-link">Admin</Link>
      )}
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-layout">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;