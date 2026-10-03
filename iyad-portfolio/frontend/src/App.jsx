import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import About from './About/About';
import Contact from './Contact/Contact';
import Projects from './Projects/Projects';
import ProjectDetail from './Projects/ProjectDetail';
import AdminLogin from './Admin/AdminLogin';
// Chargé à la demande : la coloration syntaxique et le rendu markdown alourdissent le bundle
const RepoPage = lazy(() => import('./GitHub/RepoPage'));
import useScrollReveal from './Animations/useScrollReveal';
import { LanguageProvider, useLang } from './i18n/LanguageContext';
import './App.css';
import './Animations/animations.css';

function Navigation() {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const { lang, toggle, t } = useLang();
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
    if (location.pathname.includes('/projects') || location.pathname.startsWith('/github')) {
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
        <Link to="/#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>{t('nav.home')}</Link>
        <Link to="/#experience" className={`nav-link ${activeSection === 'experience' ? 'active' : ''}`}>{t('nav.experience')}</Link>
        <Link to="/#education" className={`nav-link ${activeSection === 'education' ? 'active' : ''}`}>{t('nav.education')}</Link>
        <Link to="/#skills" className={`nav-link ${activeSection === 'skills' ? 'active' : ''}`}>{t('nav.skills')}</Link>
        <Link to="/projects" className={`nav-link ${activeSection === 'projects' ? 'active' : ''}`}>{t('nav.projects')}</Link>
        <Link to="/contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}>{t('nav.contact')}</Link>
        
        {isAdmin && (
          <button onClick={logout} className="nav-link admin-logout-btn" style={{background:'none', border:'none', cursor:'pointer'}}>{t('nav.logout')}</button>
        )}

        <button type="button" className="lang-switch" onClick={toggle} title={t('nav.language')} aria-label={t('nav.language')}>
          <span className={lang === 'fr' ? 'active' : ''}>FR</span>
          <span className={lang === 'en' ? 'active' : ''}>EN</span>
        </button>
      </div>
    </nav>
  );
}

// Composant pour le bouton de retour en haut
function ScrollToTopButton() {
  const { t } = useLang();
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
      title={t('scrollTop')}
    >
      ↑
    </button>
  );
}

// Rejoue l'animation d'entrée à chaque changement de page.
// Dans un dépôt GitHub, naviguer entre fichiers garde la même page (pas de rechargement de l'arborescence).
function AnimatedRoutes({ children }) {
  const location = useLocation();
  useScrollReveal();
  const pageKey = location.pathname.startsWith('/github/')
    ? location.pathname.split('/').slice(0, 4).join('/')
    : location.pathname;

  return (
    <div key={pageKey} className="page-transition">
      <Routes location={location}>{children}</Routes>
    </div>
  );
}

// En anglais, l'admin voit pourquoi les boutons d'édition ont disparu
function AdminLanguageNote() {
  const { isAdmin } = useAuth();
  const { lang, t } = useLang();
  if (!isAdmin || lang !== 'en') return null;
  return <div className="admin-lang-note">{t('admin.editInFrench')}</div>;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="app-layout">
            <Navigation />
            <main className="main-content">
              <AnimatedRoutes>
                <Route path="/" element={<About />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/github/:owner/:repo/*" element={<Suspense fallback={<div className="state-container"><div className="loader"></div></div>}><RepoPage /></Suspense>} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/contact" element={<Contact />} />
              </AnimatedRoutes>
            </main>
            <AdminLanguageNote />
            <ScrollToTopButton /> 
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;