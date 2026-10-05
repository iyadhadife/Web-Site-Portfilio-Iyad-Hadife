import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
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
import { NeuralBackground, CursorGlow, useMotionEffects } from './Animations/Motion';
import { LanguageProvider, useLang } from './i18n/LanguageContext';
import { ThemeProvider } from './Theme/ThemeContext';
import ThemeToggle from './Theme/ThemeToggle';
import './App.css';
import './Animations/animations.css';

function Navigation() {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const { lang, toggle, t } = useLang();
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [dragX, setDragX] = useState(0);          // glissement du volet en cours (px, vers la droite)
  const touchStart = useRef(null);

  // Mobile : la barre se cache quand on descend et réapparaît dès qu'on remonte
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 6) return;
      setIsNavHidden(y > lastY && y > 120 && window.innerWidth <= 768);
      lastY = y;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  // Volet ouvert : la page derrière ne défile plus, Échap le ferme
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [isMobileMenuOpen]);

  const toggleMenu = () => {
    setIsMobileMenuOpen((open) => !open);
    navigator.vibrate?.(8);                        // petit retour haptique (Android)
  };

  // Glisser le volet vers la droite pour le fermer (il suit le doigt)
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) setDragX(Math.max(0, dx));
  };
  const onTouchEnd = () => {
    if (dragX > 70) setIsMobileMenuOpen(false);
    setDragX(0);
    touchStart.current = null;
  };

  // Un lien vers la section déjà affichée ne change pas l'URL : on ferme le volet et on y défile quand même
  const onNavClick = (hash) => () => {
    setIsMobileMenuOpen(false);
    if (hash && location.pathname === '/' && location.hash === hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const links = [
    { to: '/#home', id: 'home', icon: '⌂', label: t('nav.home') },
    { to: '/#experience', id: 'experience', icon: '💼', label: t('nav.experience') },
    { to: '/#education', id: 'education', icon: '🎓', label: t('nav.education') },
    { to: '/#skills', id: 'skills', icon: '⚙', label: t('nav.skills') },
    { to: '/projects', id: 'projects', icon: '🗂', label: t('nav.projects') },
    { to: '/contact', id: 'contact', icon: '✉', label: t('nav.contact') },
  ];

  // Fermer le volet mobile automatiquement lors d'un changement de route/hash
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Nouvelle page sans ancre (ex. /projects) : on arrive directement en haut, sans défilement animé
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

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
    <nav className={`top-navbar ${isNavHidden && !isMobileMenuOpen ? 'nav-hidden' : ''}`}>
      <Link to="/#home" className="nav-brand-mobile" onClick={onNavClick('#home')}>Portfolio</Link>

      {/* Voile derrière le volet mobile : un toucher le referme */}
      <div className={`nav-backdrop ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />

      {/* Conteneur des liens (volet latéral sur mobile) */}
      <div
        className={`nav-links-container ${isMobileMenuOpen ? 'open' : ''} ${dragX ? 'dragging' : ''}`}
        style={dragX ? { transform: `translateX(${dragX}px)` } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {links.map((link) => (
          <Link key={link.id} to={link.to} onClick={onNavClick(link.to.includes('#') ? link.to.slice(link.to.indexOf('#')) : '')}
            className={`nav-link ${activeSection === link.id ? 'active' : ''}`}>
            <span className="nav-link-icon" aria-hidden="true">{link.icon}</span>
            <span className="nav-link-label">{link.label}</span>
          </Link>
        ))}
        
        {isAdmin && (
          <button onClick={logout} className="nav-link admin-logout-btn" style={{background:'none', border:'none', cursor:'pointer'}}>{t('nav.logout')}</button>
        )}

        <span className="nav-swipe-hint" aria-hidden="true">{t('nav.swipeHint')}</span>
      </div>

      {/* Langue et thème : toujours visibles, aussi sur mobile */}
      <div className="nav-actions">
        <button type="button" className="lang-switch" onClick={toggle} title={t('nav.language')} aria-label={t('nav.language')}>
          <span className={lang === 'fr' ? 'active' : ''}>FR</span>
          <span className={lang === 'en' ? 'active' : ''}>EN</span>
        </button>
        <ThemeToggle />

        {/* Bouton Hamburger pour mobile */}
        <button
          className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMenu}
          title="Menu"
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      <ScrollProgress />
    </nav>
  );
}

// Barre orange sous la navigation qui suit la progression du défilement
function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="scroll-progress" ref={barRef} aria-hidden="true" />;
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
      aria-label={t('scrollTop')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}

// Rejoue l'animation d'entrée à chaque changement de page.
// Dans un dépôt GitHub, naviguer entre fichiers garde la même page (pas de rechargement de l'arborescence).
function AnimatedRoutes({ children }) {
  const location = useLocation();
  useScrollReveal();
  useMotionEffects();
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
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="app-layout">
              <NeuralBackground />
              <CursorGlow />
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
    </ThemeProvider>
  );
}

export default App;