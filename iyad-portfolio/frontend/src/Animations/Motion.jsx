import { useEffect, useRef } from 'react';

// Effets de mouvement du site : fond « réseau de neurones », cartes en 3D, halo qui suit le curseur,
// boutons aimantés et parallaxe. Tout est coupé si le système demande moins d'animations.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

const accentRgb = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
  return value || '217, 88, 31';
};

// --- FOND : graphe de neurones qui dérive, se relie et réagit au pointeur (souris ou doigt) ---
export function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const still = reducedMotion();
    let width = 0;
    let height = 0;
    let nodes = [];
    let frame = 0;
    let color = accentRgb();
    const pointer = { x: -9999, y: -9999, active: false };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Moins de nœuds sur téléphone : fluide et économe en batterie
      const count = Math.round(Math.min(90, Math.max(28, (width * height) / 16000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 1.8,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const maxDist = width < 600 ? 110 : 140;
      for (const n of nodes) {
        if (!still) {
          // Le pointeur attire doucement les nœuds proches, comme une activation
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d = Math.hypot(dx, dy);
          if (pointer.active && d < 180 && d > 1) {
            n.vx += (dx / d) * 0.018;
            n.vy += (dy / d) * 0.018;
          }
          n.vx *= 0.985;
          n.vy *= 0.985;
          n.vx += (Math.random() - 0.5) * 0.02;
          n.vy += (Math.random() - 0.5) * 0.02;
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20) n.x = width + 20;
          if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20;
          if (n.y > height + 20) n.y = -20;
          n.pulse += 0.03;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxDist) {
            ctx.strokeStyle = `rgba(${color}, ${(1 - d / maxDist) * 0.28})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // Liens plus vifs vers le pointeur
        if (pointer.active) {
          const d = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (d < 170) {
            ctx.strokeStyle = `rgba(${color}, ${(1 - d / 170) * 0.55})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        const glow = 0.45 + Math.sin(n.pulse) * 0.25;
        ctx.fillStyle = `rgba(${color}, ${glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!still) frame = requestAnimationFrame(draw);
    };

    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      pointer.x = p.clientX;
      pointer.y = p.clientY;
      pointer.active = true;
    };
    const onLeave = () => { pointer.active = false; };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !still) frame = requestAnimationFrame(draw);
    };
    // Le thème (clair / sombre) change la couleur d'accent
    const themeObserver = new MutationObserver(() => { color = accentRgb(); if (still) draw(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('touchend', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('touchend', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="neural-background" aria-hidden="true" />;
}

// --- HALO qui suit le curseur (ordinateur) ---
export function CursorGlow() {
  const ref = useRef(null);
  useEffect(() => {
    if (!finePointer() || reducedMotion()) return undefined;
    let x = 0; let y = 0; let cx = 0; let cy = 0; let frame = 0;
    const onMove = (e) => { x = e.clientX; y = e.clientY; ref.current?.classList.add('visible'); };
    const tick = () => {
      cx += (x - cx) * 0.15;
      cy += (y - cy) * 0.15;
      if (ref.current) ref.current.style.transform = `translate(${cx}px, ${cy}px)`;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

// --- Cartes en 3D, boutons aimantés et parallaxe de la photo ---
const TILT_SELECTOR = '.project-card, .skill-category, .timeline-frise-content, .contact-item';
const MAGNET_SELECTOR = '.view-projects-btn, .scroll-to-top-btn, .submit-btn, .gh-external-btn';

export function useMotionEffects() {
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const cleanups = [];

    if (finePointer()) {
      // Inclinaison 3D qui suit la souris, avec un reflet lumineux (variables CSS --gx / --gy)
      let current = null;
      const reset = (el) => {
        el.classList.remove('tilting');
        el.style.removeProperty('--rx');
        el.style.removeProperty('--ry');
      };
      const onMove = (e) => {
        const el = e.target.closest?.(TILT_SELECTOR);
        if (current && current !== el) reset(current);
        current = el;
        if (!el || el.closest('.fullscreen-overlay-mode') || el.classList.contains('reveal')) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const strength = el.matches('.timeline-frise-content') ? 4 : 8;
        el.classList.add('tilting');
        el.style.setProperty('--rx', `${(0.5 - py) * strength}deg`);
        el.style.setProperty('--ry', `${(px - 0.5) * strength}deg`);
        el.style.setProperty('--gx', `${px * 100}%`);
        el.style.setProperty('--gy', `${py * 100}%`);
      };
      // Boutons aimantés : ils glissent vers le curseur quand il s'approche
      const onMagnet = (e) => {
        document.querySelectorAll(MAGNET_SELECTOR).forEach((btn) => {
          const r = btn.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const near = Math.hypot(dx, dy) < Math.max(r.width, r.height) * 0.9;
          btn.style.translate = near ? `${dx * 0.25}px ${dy * 0.3}px` : '';
        });
      };
      const onOut = () => { if (current) reset(current); current = null; };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointermove', onMagnet, { passive: true });
      document.addEventListener('pointerleave', onOut);
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointermove', onMagnet);
        document.removeEventListener('pointerleave', onOut);
      });
    }

    // Parallaxe au défilement (ordinateur et téléphone) : photo et halo du profil
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        document.documentElement.style.setProperty('--scroll-y', `${y}`);
        const photo = document.querySelector('.profile-image-container');
        if (photo && y < 900) {
          photo.style.translate = `0 ${y * 0.18}px`;
          photo.style.scale = `${1 - Math.min(y, 600) / 3000}`;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); });

    return () => cleanups.forEach((fn) => fn());
  }, []);
}

// --- Texte révélé lettre par lettre ---
export function SplitText({ text = '', className = '', delay = 0, step = 45 }) {
  return (
    <span className={`split-text ${className}`} aria-label={text}>
      {[...text].map((char, i) => (
        <span key={i} className="split-char" aria-hidden="true" style={{ animationDelay: `${delay + i * step}ms` }}>
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
}
