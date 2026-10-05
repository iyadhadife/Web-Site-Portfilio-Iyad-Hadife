import { useEffect, useRef } from 'react';

// Effets de mouvement du site : fond 3D (réseau de neurones et Transformer), cartes en 3D, halo qui suit
// le curseur, profondeur au défilement et parallaxe. Tout est coupé si le système demande moins d'animations.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

const accentRgb = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
  return value || '217, 88, 31';
};

// --- FOND 3D : un réseau de neurones (couches, connexions, signaux) et un bloc Transformer
// (jetons, attention), dessinés en perspective. La scène tourne doucement, suit le pointeur (souris ou doigt),
// l'inclinaison du téléphone et le défilement de la page. ---
export function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const still = reducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let mobile = false;
    let frame = 0;
    let color = accentRgb();
    const rand = (a, b) => a + Math.random() * (b - a);

    // Cible de rotation (pointeur, inclinaison) et rotation lissée réellement appliquée
    const target = { yaw: 0, pitch: 0 };
    const view = { yaw: 0, pitch: 0 };

    // --- Réseau de neurones : couches de neurones disposées en cercle, de gauche à droite ---
    const LAYERS = [6, 10, 12, 10, 4];
    const neurons = [];
    const layerIndex = [];
    LAYERS.forEach((count, l) => {
      const x = (l - (LAYERS.length - 1) / 2) * 120;
      const ids = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const radius = 30 + count * 7;
        ids.push(neurons.length);
        neurons.push({ x, y: Math.sin(a) * radius - 90, z: Math.cos(a) * radius, layer: l, glow: 0 });
      }
      layerIndex.push(ids);
    });
    const synapses = [];
    for (let l = 0; l < LAYERS.length - 1; l++) {
      for (const a of layerIndex[l]) {
        // Chaque neurone est relié à quelques neurones de la couche suivante (pas tous : plus lisible)
        const next = [...layerIndex[l + 1]].sort(() => Math.random() - 0.5).slice(0, 4);
        for (const b of next) synapses.push({ a, b });
      }
    }
    // Signaux qui traversent le réseau couche après couche (propagation avant)
    const signals = [];
    const spawnSignal = () => {
      const start = synapses.filter((s) => neurons[s.a].layer === 0);
      const s = start[Math.floor(Math.random() * start.length)];
      signals.push({ syn: s, t: 0, speed: rand(0.012, 0.022) });
    };

    // --- Transformer : une phrase de jetons, chacun avec sa pile d'embeddings, et l'attention entre eux ---
    const TOKENS = 7;
    const tokens = Array.from({ length: TOKENS }, (_, i) => ({ x: (i - (TOKENS - 1) / 2) * 70, y: 120, z: 0 }));
    const heads = [];
    for (let h = 0; h < 3; h++) {
      const pairs = [];
      for (let i = 0; i < TOKENS; i++) {
        for (let j = 0; j < TOKENS; j++) {
          if (i !== j && Math.random() < 0.28) pairs.push({ i, j, phase: rand(0, Math.PI * 2) });
        }
      }
      heads.push({ z: (h - 1) * 45, pairs });
    }

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      mobile = width < 768;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Projection perspective d'un point 3D (rotation lacet puis tangage)
    const project = (p, scale) => {
      const cy = Math.cos(view.yaw); const sy = Math.sin(view.yaw);
      const cp = Math.cos(view.pitch); const sp = Math.sin(view.pitch);
      const x1 = p.x * cy - p.z * sy;
      const z1 = p.x * sy + p.z * cy;
      const y1 = p.y * cp - z1 * sp;
      const z2 = p.y * sp + z1 * cp;
      const f = 700 / (700 + z2);
      return { x: width / 2 + x1 * f * scale, y: height / 2 + y1 * f * scale, f, z: z2 };
    };

    const draw = (time = 0) => {
      const t = time / 1000;
      // Rotation lente permanente + pointeur / inclinaison + défilement
      const scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - height);
      view.yaw += (target.yaw + t * 0.12 + scroll * 1.6 - view.yaw) * 0.05;
      view.pitch += (target.pitch + 0.25 - scroll * 0.35 - view.pitch) * 0.05;
      const scale = mobile ? width / 470 : Math.min(width / 1100, 1.05);

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';

      // Synapses
      const P = neurons.map((n) => project(n, scale));
      for (const s of synapses) {
        const a = P[s.a]; const b = P[s.b];
        const depth = Math.min(a.f, b.f);
        ctx.strokeStyle = `rgba(${color}, ${0.07 + depth * 0.1})`;
        ctx.lineWidth = 0.8 * depth;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // Signaux : un point lumineux glisse le long d'une synapse, puis repart de son arrivée
      if (!still && signals.length < (mobile ? 10 : 18) && Math.random() < 0.08) spawnSignal();
      for (let k = signals.length - 1; k >= 0; k--) {
        const sig = signals[k];
        sig.t += still ? 0 : sig.speed;
        const a = P[sig.syn.a]; const b = P[sig.syn.b];
        const x = a.x + (b.x - a.x) * sig.t;
        const y = a.y + (b.y - a.y) * sig.t;
        ctx.fillStyle = `rgba(${color}, 0.95)`;
        ctx.shadowColor = `rgba(${color}, 0.9)`;
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(x, y, 2.4 * a.f, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (sig.t >= 1) {
          neurons[sig.syn.b].glow = 1;
          const next = synapses.filter((s) => s.a === sig.syn.b);
          if (next.length) {
            sig.syn = next[Math.floor(Math.random() * next.length)];
            sig.t = 0;
          } else {
            signals.splice(k, 1);
          }
        }
      }

      // Neurones (s'illuminent quand un signal les atteint)
      neurons.forEach((n, i) => {
        const p = P[i];
        n.glow *= 0.94;
        const r = (2.2 + n.glow * 3) * p.f * (mobile ? 1.1 : 1.3);
        ctx.fillStyle = `rgba(${color}, ${0.35 + p.f * 0.25 + n.glow * 0.4})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      });

      // Transformer : piles d'embeddings sous chaque jeton
      const T = tokens.map((tk) => project(tk, scale));
      tokens.forEach((tk, i) => {
        for (let k = 0; k < 4; k++) {
          const p = project({ x: tk.x, y: tk.y + 14 + k * 9, z: tk.z }, scale);
          const w = 18 * p.f * scale * (mobile ? 1.4 : 1);
          ctx.fillStyle = `rgba(${color}, ${0.1 + 0.08 * Math.sin(t * 2 + i + k)})`;
          ctx.fillRect(p.x - w / 2, p.y - 2.5 * p.f, w, 5 * p.f);
        }
        const p = T[i];
        ctx.strokeStyle = `rgba(${color}, 0.55)`;
        ctx.lineWidth = 1.2;
        const s = 9 * p.f * (mobile ? 1.2 : 1.4);
        ctx.strokeRect(p.x - s, p.y - s, s * 2, s * 2);
      });

      // Têtes d'attention : arcs entre jetons, dont l'intensité varie comme des poids d'attention
      heads.forEach((head, h) => {
        for (const pr of head.pairs) {
          const a = project({ ...tokens[pr.i], z: head.z }, scale);
          const b = project({ ...tokens[pr.j], z: head.z }, scale);
          const lift = project({ x: (tokens[pr.i].x + tokens[pr.j].x) / 2, y: 120 - 30 - Math.abs(pr.i - pr.j) * 16, z: head.z }, scale);
          const weight = Math.max(0, Math.sin(t * 1.3 + pr.phase + h));
          if (weight < 0.15) continue;
          ctx.strokeStyle = `rgba(${color}, ${weight * 0.35 * a.f})`;
          ctx.lineWidth = 0.6 + weight * 1.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(lift.x * 2 - (a.x + b.x) / 2, lift.y * 2 - (a.y + b.y) / 2, b.x, b.y);
          ctx.stroke();
        }
      });

      if (!still) frame = requestAnimationFrame(draw);
    };

    const onPointer = (e) => {
      const p = e.touches ? e.touches[0] : e;
      target.yaw = (p.clientX / width - 0.5) * 0.9;
      target.pitch = (p.clientY / height - 0.5) * 0.5;
    };
    // Téléphone : la scène suit l'inclinaison de l'appareil (Android ; iOS demande une autorisation)
    const onTilt = (e) => {
      if (e.gamma == null) return;
      target.yaw = Math.max(-1, Math.min(1, e.gamma / 35)) * 0.6;
      target.pitch = Math.max(-1, Math.min(1, (e.beta - 45) / 45)) * 0.3;
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !still) frame = requestAnimationFrame(draw);
    };
    const themeObserver = new MutationObserver(() => { color = accentRgb(); if (still) draw(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    resize();
    if (still) draw(); else frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchmove', onPointer, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchmove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
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

// --- Cartes en 3D (souris), profondeur au défilement (ordinateur et téléphone) et parallaxe de la photo ---
const TILT_SELECTOR = '.project-card, .skill-category, .timeline-frise-item, .contact-item';
const DEPTH_SELECTOR = '.project-card, .skill-category, .timeline-frise-item';

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
        const strength = el.matches('.timeline-frise-item') ? 4 : 8;
        el.classList.add('tilting');
        el.style.setProperty('--rx', `${(0.5 - py) * strength}deg`);
        el.style.setProperty('--ry', `${(px - 0.5) * strength}deg`);
        el.style.setProperty('--gx', `${px * 100}%`);
        el.style.setProperty('--gy', `${py * 100}%`);
      };
      const onOut = () => { if (current) reset(current); current = null; };
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onOut);
      cleanups.push(() => {
        window.removeEventListener('pointermove', onMove);
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
        // Profondeur légère : chaque carte s'incline un peu selon sa position dans l'écran,
        // comme si on la regardait de face au centre et de biais en haut ou en bas
        const vh = window.innerHeight;
        document.querySelectorAll(DEPTH_SELECTOR).forEach((el) => {
          if (el.classList.contains('reveal') || el.closest('.fullscreen-overlay-mode')) return;
          const r = el.getBoundingClientRect();
          if (r.bottom < -100 || r.top > vh + 100) return;
          const offset = (r.top + r.height / 2 - vh / 2) / vh;      // -0.5 en haut, +0.5 en bas
          el.style.rotate = `x ${(-offset * 10).toFixed(2)}deg`;
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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
