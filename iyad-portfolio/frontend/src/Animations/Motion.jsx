import { useEffect, useRef } from 'react';

// Effets de mouvement du site : fond 3D (réseau de neurones et Transformer), cartes en 3D, halo qui suit
// le curseur, profondeur au défilement et parallaxe. Tout est coupé si le système demande moins d'animations.

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

const accentRgb = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
  return value || '217, 88, 31';
};

// --- FOND 3D : un vrai petit réseau de neurones qui prédit en temps réel, et un Transformer dont l'attention
// est réellement calculée. Entrées du réseau : position du pointeur (souris ou doigt), temps, défilement.
// Chaque passe avant se voit couche par couche ; la dernière couche apprend en direct (descente de gradient).
// La scène tourne en perspective et suit le pointeur, l'inclinaison du téléphone et le défilement. ---
const randn = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random());
const softmax = (v) => {
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
};
const NEGATIVE_RGB = '120, 170, 255';           // activations et poids négatifs : bleu froid
const CLASSES = ['IA', 'Data', 'Cloud', '3D'];  // sorties du réseau (neutres en français et en anglais)

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
    const pointer = { x: 0.5, y: 0.5 };
    const target = { yaw: 0, pitch: 0 };
    const view = { yaw: 0, pitch: 0.25 };

    // ================= Réseau dense : 5 entrées -> 9 -> 11 -> 9 -> 4 classes =================
    const SIZES = [5, 9, 11, 9, 4];
    const L = SIZES.length;
    const weights = [];                       // weights[l][j][i] : de la couche l (i) vers l+1 (j)
    const biases = [];
    for (let l = 0; l < L - 1; l++) {
      const scale = Math.sqrt(2 / SIZES[l]);
      weights.push(Array.from({ length: SIZES[l + 1] }, () => Array.from({ length: SIZES[l] }, () => randn() * scale)));
      biases.push(Array.from({ length: SIZES[l + 1] }, () => randn() * 0.1));
    }
    const act = SIZES.map((n) => new Array(n).fill(0));     // activations calculées
    const shown = SIZES.map((n) => new Array(n).fill(0));   // activations affichées (révélées par la vague)
    let probs = new Array(SIZES[L - 1]).fill(1 / SIZES[L - 1]);
    let loss = 0;
    let passes = 0;

    // Position 3D des neurones : chaque couche est un anneau, les couches se suivent de gauche à droite
    const pos = SIZES.map((count, l) => Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + l * 0.4;
      const radius = 22 + count * 7.5;
      return { x: (l - (L - 1) / 2) * 125, y: Math.sin(a) * radius - 95, z: Math.cos(a) * radius };
    }));

    const inputs = (t) => [
      pointer.x * 2 - 1,
      pointer.y * 2 - 1,
      Math.sin(t * 2.3),
      Math.cos(t * 1.7),
      (window.scrollY / Math.max(1, document.documentElement.scrollHeight - height)) * 2 - 1,
    ];

    // Passe avant complète (les valeurs sont révélées ensuite couche par couche à l'écran)
    const forward = (x) => {
      act[0] = x;
      for (let l = 0; l < L - 1; l++) {
        const out = weights[l].map((row, j) => row.reduce((s, w, i) => s + w * act[l][i], biases[l][j]));
        act[l + 1] = l === L - 2 ? out : out.map(Math.tanh);
      }
      probs = softmax(act[L - 1]);
    };

    // Apprentissage en direct de la dernière couche : la classe visée dépend du quadrant du pointeur
    const learn = () => {
      const goal = (pointer.x > 0.5 ? 1 : 0) + (pointer.y > 0.5 ? 2 : 0);
      loss = loss * 0.8 + -Math.log(probs[goal] + 1e-9) * 0.2;
      const h = act[L - 2];
      weights[L - 2].forEach((row, j) => {
        const grad = probs[j] - (j === goal ? 1 : 0);
        row.forEach((_, i) => { row[i] -= 0.08 * grad * h[i]; });
        biases[L - 2][j] -= 0.08 * grad;
      });
    };

    // Vague de calcul : PASS secondes par passe, la couche l est calculée pendant [l, l+1] / (L-1)
    const PASS = 0.75;
    let passStart = 0;

    // ================= Transformer : 7 jetons, 3 têtes, attention = softmax(QKᵀ / √d) =================
    const TOKENS = 7;
    const D = 6;
    const tokenBase = Array.from({ length: TOKENS }, () => Array.from({ length: D }, randn));
    const tokenFreq = Array.from({ length: TOKENS }, () => Array.from({ length: D }, () => 0.6 + Math.random() * 1.6));
    const heads = Array.from({ length: 3 }, (_, h) => ({
      z: (h - 1) * 48,
      wq: Array.from({ length: D }, () => Array.from({ length: D }, () => randn() / Math.sqrt(D))),
      wk: Array.from({ length: D }, () => Array.from({ length: D }, () => randn() / Math.sqrt(D))),
    }));
    const matvec = (m, v) => m.map((row) => row.reduce((s, w, i) => s + w * v[i], 0));
    const tokenPos = Array.from({ length: TOKENS }, (_, i) => ({ x: (i - (TOKENS - 1) / 2) * 72, y: 130, z: 0 }));

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

    const project = (p, scale) => {
      const cy = Math.cos(view.yaw); const sy = Math.sin(view.yaw);
      const cp = Math.cos(view.pitch); const sp = Math.sin(view.pitch);
      const x1 = p.x * cy - p.z * sy;
      const z1 = p.x * sy + p.z * cy;
      const y1 = p.y * cp - z1 * sp;
      const z2 = p.y * sp + z1 * cp;
      const f = 700 / (700 + z2);
      return { x: width / 2 + x1 * f * scale, y: height / 2 + y1 * f * scale, f };
    };
    const rgba = (value, alpha) => `rgba(${value >= 0 ? color : NEGATIVE_RGB}, ${alpha})`;

    const draw = (time = 0) => {
      const t = time / 1000;
      const scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - height);
      // Rotation rapide et réactive
      view.yaw += (target.yaw + t * 0.45 + scroll * 2.4 - view.yaw) * 0.12;
      view.pitch += (target.pitch + 0.28 - scroll * 0.4 - view.pitch) * 0.12;
      const scale = mobile ? width / 470 : Math.min(width / 1100, 1.05);
      const font = mobile ? 10 : 12;

      // Nouvelle passe : nouvelles entrées, calcul, apprentissage
      if (t - passStart > PASS || passes === 0) {
        if (passes > 0) learn();
        forward(inputs(t));
        passStart = t;
        passes++;
        shown.forEach((layer) => layer.fill(0));
      }
      const wave = still ? L : ((t - passStart) / PASS) * (L - 1);  // 0 -> L-1 : couche en cours de calcul
      for (let l = 0; l < L; l++) {
        if (wave >= l) shown[l] = act[l];
      }

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      const P = pos.map((layer) => layer.map((p) => project(p, scale)));

      // Connexions : couleur = signe de w·a, épaisseur = intensité ; la vague parcourt la couche en calcul
      for (let l = 0; l < L - 1; l++) {
        const computing = wave >= l && wave < l + 1;
        const progress = wave - l;
        weights[l].forEach((row, j) => {
          row.forEach((w, i) => {
            const a = P[l][i]; const b = P[l + 1][j];
            const contrib = w * act[l][i];
            const strength = Math.min(1, Math.abs(contrib));
            const done = wave >= l + 1;
            const alpha = (done ? 0.05 + strength * 0.22 : 0.035) * a.f;
            ctx.strokeStyle = rgba(contrib, alpha);
            ctx.lineWidth = (0.5 + (done ? strength * 1.4 : 0)) * a.f;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            // Impulsion qui transporte la contribution vers le neurone suivant
            if (computing && strength > 0.15) {
              const x = a.x + (b.x - a.x) * progress;
              const y = a.y + (b.y - a.y) * progress;
              ctx.fillStyle = rgba(contrib, 0.5 + strength * 0.5);
              ctx.beginPath(); ctx.arc(x, y, (1.2 + strength * 2.2) * a.f, 0, Math.PI * 2); ctx.fill();
            }
          });
        });
      }

      // Neurones : taille et éclat = |activation| ; anneau autour de la couche en cours de calcul
      for (let l = 0; l < L; l++) {
        const computingNext = wave >= l - 1 && wave < l && l > 0;
        P[l].forEach((p, i) => {
          const v = l === L - 1 ? probs[i] * (wave >= L - 1 ? 1 : 0) : shown[l][i];
          const mag = Math.min(1, Math.abs(v));
          const r = (2 + mag * 5) * p.f * (mobile ? 1.1 : 1.25);
          ctx.fillStyle = rgba(v, 0.25 + mag * 0.7);
          if (mag > 0.5) { ctx.shadowColor = rgba(v, 0.9); ctx.shadowBlur = 14 * mag; }
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          if (computingNext) {
            ctx.strokeStyle = `rgba(${color}, 0.5)`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(p.x, p.y, r + 4 * p.f, 0, Math.PI * 2); ctx.stroke();
          }
        });
      }

      // Entrées : petites jauges ; sorties : probabilités et prédiction
      ctx.font = `600 ${font}px Inter, sans-serif`;
      ctx.textBaseline = 'middle';
      const labels = ['x', 'y', 'sin t', 'cos t', 'scroll'];
      P[0].forEach((p, i) => {
        const v = act[0][i];
        ctx.fillStyle = rgba(v, 0.75);
        ctx.fillRect(p.x - 34 * p.f, p.y - 2, -Math.abs(v) * 22 * p.f, 4);
        ctx.fillStyle = `rgba(${color}, 0.6)`;
        ctx.textAlign = 'right';
        ctx.fillText(labels[i], p.x - 8 * p.f, p.y - 9 * p.f);
      });
      const best = probs.indexOf(Math.max(...probs));
      const revealed = wave >= L - 1;
      P[L - 1].forEach((p, i) => {
        ctx.textAlign = 'left';
        const pct = revealed ? probs[i] : 0;
        ctx.fillStyle = `rgba(${color}, ${i === best && revealed ? 0.95 : 0.45})`;
        ctx.fillRect(p.x + 12 * p.f, p.y + 6 * p.f, pct * 60 * p.f, 3);
        ctx.fillText(`${CLASSES[i]} ${revealed ? `${Math.round(pct * 100)}%` : '…'}`, p.x + 12 * p.f, p.y - 4 * p.f);
      });
      if (revealed) {
        const o = project({ x: pos[L - 1][0].x + 40, y: -235, z: 0 }, scale);
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(${color}, 0.9)`;
        ctx.font = `700 ${font + 2}px Inter, sans-serif`;
        ctx.fillText(`▶ ${CLASSES[best]} · ${Math.round(probs[best] * 100)}%`, o.x, o.y);
        ctx.font = `500 ${font - 1}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(${color}, 0.55)`;
        ctx.fillText(`loss ${loss.toFixed(2)} · passe ${passes}`, o.x, o.y + font + 6);
      }

      // ================= Transformer =================
      const emb = tokenBase.map((base, i) => base.map((b, k) => b + 0.9 * Math.sin(t * tokenFreq[i][k] + k)));
      const query = Math.floor(t * 3) % TOKENS;           // jeton dont on calcule l'attention en ce moment
      const T = tokenPos.map((tk) => project(tk, scale));
      emb.forEach((e, i) => {
        // Pile d'embeddings : chaque barre est une dimension du vecteur du jeton
        e.forEach((v, k) => {
          const p = project({ x: tokenPos[i].x, y: tokenPos[i].y + 16 + k * 8, z: 0 }, scale);
          const w = Math.min(1, Math.abs(v) / 2) * 26 * p.f * scale;
          ctx.fillStyle = rgba(v, 0.18 + Math.min(1, Math.abs(v) / 2) * 0.4);
          ctx.fillRect(p.x - w / 2, p.y - 2.2 * p.f, w, 4.4 * p.f);
        });
        const p = T[i];
        const s = 9 * p.f * (mobile ? 1.2 : 1.4);
        ctx.strokeStyle = `rgba(${color}, ${i === query ? 0.95 : 0.45})`;
        ctx.lineWidth = i === query ? 2 : 1.1;
        ctx.strokeRect(p.x - s, p.y - s, s * 2, s * 2);
      });
      heads.forEach((head) => {
        const q = emb.map((e) => matvec(head.wq, e));
        const k = emb.map((e) => matvec(head.wk, e));
        for (let i = 0; i < TOKENS; i++) {
          const att = softmax(k.map((kj) => kj.reduce((s, v, d) => s + v * q[i][d], 0) / Math.sqrt(D)));
          att.forEach((weight, j) => {
            if (i === j || weight < 0.12) return;
            const focus = i === query;
            const a = project({ ...tokenPos[i], z: head.z }, scale);
            const b = project({ ...tokenPos[j], z: head.z }, scale);
            const lift = project({ x: (tokenPos[i].x + tokenPos[j].x) / 2, y: 100 - Math.abs(i - j) * 17, z: head.z }, scale);
            ctx.strokeStyle = `rgba(${color}, ${(focus ? 0.25 + weight * 0.7 : weight * 0.22) * a.f})`;
            ctx.lineWidth = (focus ? 1 : 0.5) + weight * (focus ? 3 : 1.2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(lift.x * 2 - (a.x + b.x) / 2, lift.y * 2 - (a.y + b.y) / 2, b.x, b.y);
            ctx.stroke();
          });
        }
      });

      if (!still) frame = requestAnimationFrame(draw);
    };

    const onPointer = (e) => {
      const p = e.touches ? e.touches[0] : e;
      pointer.x = p.clientX / width;
      pointer.y = p.clientY / height;
      target.yaw = (pointer.x - 0.5) * 0.9;
      target.pitch = (pointer.y - 0.5) * 0.5;
    };
    // Téléphone : la scène suit l'inclinaison de l'appareil (Android ; iOS demande une autorisation)
    const onTilt = (e) => {
      if (e.gamma == null) return;
      pointer.x = Math.max(0, Math.min(1, 0.5 + e.gamma / 70));
      pointer.y = Math.max(0, Math.min(1, e.beta / 90));
      target.yaw = (pointer.x - 0.5) * 1.2;
      target.pitch = (pointer.y - 0.5) * 0.5;
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

// --- Parallaxe de la photo au défilement (les cartes restent fixes pour que leurs boutons restent cliquables) ---

export function useMotionEffects() {
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const cleanups = [];

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
