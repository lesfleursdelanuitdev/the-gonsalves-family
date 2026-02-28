'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-bg transition"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <FontAwesomeIcon icon={faSun} style={{ width: 18, height: 18 }} />
      ) : (
        <FontAwesomeIcon icon={faMoon} style={{ width: 18, height: 18 }} />
      )}
    </button>
  );
}
