import { useState, useEffect } from 'react';

const STORAGE_KEY = 'fantt-theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'fantasy';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'fantasy' ? 'light' : 'fantasy'));
  };

  return { theme, toggleTheme };
}
