import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fermer le volet mobile automatiquement lors d'un changement de route/hash
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Gérer le défilement fluide vers une ancre (ex: /#skills, /#experience, etc.)
  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  // Gérer l'état actif des onglets et le scroll spy
  useEffect(() => {
    if (location.pathname.includes('/projects')) {
      setActiveSection('projects');
      return;
    }
    if (location.pathname.includes('/contact')) {
      setActiveSection('contact');
      return;
    }

    if (location.pathname === '/') {
      if (location.hash) {
        setActiveSection(location.hash.replace('#', ''));
      } else {
        setActiveSection('home');
      }
    }

    const handleScroll = () => {
      if (location.pathname !== '/') return;
      
      const sections = ['home', 'experience', 'education', 'skills'];
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
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  return (
    <nav className="top-navbar">
      <div className="nav-brand-mobile">Portfolio</div>
      
      {/* Bouton Hamburger pour mobile */}
      <button 
        className="hamburger-btn" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        title="Menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Conteneur des liens (Volet sur mobile) */}
      <div className={`nav-links-container ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link to="/#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>Home</Link>
        <Link to="/#experience" className={`nav-link ${activeSection === 'experience' ? 'active' : ''}`}>Experience</Link>
        <Link to="/#education" className={`nav-link ${activeSection === 'education' ? 'active' : ''}`}>Education</Link>
        <Link to="/#skills" className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}>Skills</Link>
        <Link to="/projects" className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`}>Projects</Link>
        <Link to="/contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</Link>
        
        {isAdmin && (
          <button onClick={logout} className="nav-link admin-logout-btn" style={{background:'none', border:'none', cursor:'pointer'}}>Déconnexion</button>
        )}
      </div>
    </nav>
  );
}

// Composant pour le bouton de retour en haut
function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Afficher le bouton si on a scrollé de plus de 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button 
      onClick={scrollToTop} 
      className="scroll-to-top-btn"
      title="Remonter en haut"
    >
      ↑
    </button>
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
          <ScrollToTopButton /> 
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;