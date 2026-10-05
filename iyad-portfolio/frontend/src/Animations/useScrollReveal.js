import { useEffect } from 'react';

// Éléments qui apparaissent en fondu quand ils entrent dans l'écran
const REVEAL_SELECTOR = [
  '.profile-header',
  '.section-title-wrapper',
  '.timeline-frise-item',
  '.skill-category',
  '.projects-header',
  '.project-card',
  '.contact-item',
  '.gh-repo-header',
  '.gh-dir-list',
  '.gh-file',
  '.nb-cell',
].join(',');

const STAGGER_MS = 40;
const MAX_STAGGER = 5;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Les classes ne sont ajoutées que par JavaScript : sans JS, tout reste visible.
// Une fois l'animation finie, on les retire pour que les effets de survol
// et le mode plein écran (position: fixed) retrouvent leur comportement normal.
export default function useScrollReveal(rootSelector = '.main-content') {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root || prefersReducedMotion() || !('IntersectionObserver' in window)) return undefined;

    const seen = new WeakSet();

    const finish = (el) => {
      el.classList.remove('reveal', 'reveal-in');
      el.style.removeProperty('--reveal-delay');
    };

    const intersection = new IntersectionObserver((entries) => {
      let batch = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        intersection.unobserve(el);
        // Décalage en cascade entre les éléments qui apparaissent ensemble (cartes d'une grille, etc.)
        const index = Math.min(batch++, MAX_STAGGER);
        el.style.setProperty('--reveal-delay', `${index * STAGGER_MS}ms`);
        el.classList.add('reveal-in');
        const onEnd = (e) => {
          if (e.target !== el || e.propertyName !== 'opacity') return;
          el.removeEventListener('transitionend', onEnd);
          finish(el);
        };
        el.addEventListener('transitionend', onEnd);
        setTimeout(() => finish(el), 700 + index * STAGGER_MS);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    const register = () => {
      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (seen.has(el) || el.closest('.fullscreen-overlay-mode')) return;
        seen.add(el);
        el.classList.add('reveal');
        intersection.observe(el);
      });
      // En mode plein écran, tout le contenu s'affiche directement
      root.querySelectorAll('.fullscreen-overlay-mode .reveal').forEach((el) => {
        intersection.unobserve(el);
        finish(el);
      });
    };

    register();
    // Le contenu arrive de façon asynchrone (API) : on surveille les ajouts dans la page
    const mutations = new MutationObserver(register);
    mutations.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    return () => {
      mutations.disconnect();
      intersection.disconnect();
    };
  }, [rootSelector]);
}
