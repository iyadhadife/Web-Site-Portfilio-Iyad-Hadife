import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import translations from './translations';

export const LANGUAGES = ['fr', 'en'];
const STORAGE_KEY = 'portfolio-lang';

const LanguageContext = createContext(null);

const initialLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(saved)) return saved;
  } catch {
    // stockage indisponible (navigation privée)
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignoré
    }
  }, [lang]);

  // Texte de l'interface, avec remplacement des {variables}
  const t = useCallback((key, vars = {}) => {
    const text = translations[lang][key] ?? translations.fr[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
  }, [lang]);

  const toggle = useCallback(() => setLang((l) => (l === 'fr' ? 'en' : 'fr')), []);

  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, toggle, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);
