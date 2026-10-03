import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Thème clair (blanc + orange) ou sombre (noir + orange).
// Le choix est mémorisé ; à la première visite on suit le réglage du système.
// index.html applique déjà le bon thème avant le chargement de React (pas de flash).
const STORAGE_KEY = 'portfolio-theme';
const ThemeContext = createContext(null);

const readSaved = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null; // stockage indisponible (navigation privée)
  }
};

const systemTheme = () => (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => readSaved() || systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
  }, [theme]);

  // Tant que le visiteur n'a rien choisi, on suit les changements du système
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;
    const onChange = (e) => { if (!readSaved()) setTheme(e.matches ? 'dark' : 'light'); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    window.setTimeout(() => root.classList.remove('theme-switching'), 450);
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignoré
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
