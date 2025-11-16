import { useEffect } from 'react';

export default function ForceDarkMode() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!root.classList.contains('dark')) {
      root.classList.add('dark');
    }
    try {
      localStorage.setItem('theme', 'dark');
    } catch (error) {
      console.warn('Unable to persist theme preference', error);
    }
  }, []);

  return null;
}
