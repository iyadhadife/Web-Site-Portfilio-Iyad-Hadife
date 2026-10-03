import React from 'react';
import { useTheme } from './ThemeContext';
import { useLang } from '../i18n/LanguageContext';

// Interrupteur soleil / lune
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark');

  return (
    <button type="button" className={`theme-toggle ${theme}`} onClick={toggle} title={label} aria-label={label}>
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          <svg className="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <g strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1.5" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22.5" />
              <line x1="1.5" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22.5" y2="12" />
              <line x1="4.6" y1="4.6" x2="6.4" y2="6.4" /><line x1="17.6" y1="17.6" x2="19.4" y2="19.4" />
              <line x1="4.6" y1="19.4" x2="6.4" y2="17.6" /><line x1="17.6" y1="6.4" x2="19.4" y2="4.6" />
            </g>
          </svg>
          <svg className="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

export default ThemeToggle;
