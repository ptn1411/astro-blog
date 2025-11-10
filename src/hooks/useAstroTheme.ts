import { useEffect, useState } from 'react';

export default function useAstroTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const checkTheme = () => root.classList.contains('dark');
    setIsDark(checkTheme());

    const observer = new MutationObserver(() => {
      setIsDark(checkTheme());
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
