import { useEffect, useState } from 'react';
import Badge3D from './Badge3D';
import ForceDarkMode from './ForceDarkMode';

/**
 * Đồng bộ theme + style với AstroWind
 * Phong cách typography, màu chữ, font-heading, dark mode, gradient, spacing
 */
export default function BadgeShowcase({ attendee }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const checkMedia = () => setIsDesktop(window.innerWidth >= 768);
    checkMedia();
    window.addEventListener('resize', checkMedia);
    return () => window.removeEventListener('resize', checkMedia);
  }, []);

  // Theo dõi theme từ <html class="dark">
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains('dark'));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Nếu không có dữ liệu
  if (!attendee || !attendee.email) {
    return (
      <section
        className={`py-20 text-center transition-colors duration-500 ${
          isDark
            ? 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white'
            : 'bg-gradient-to-b from-white via-zinc-50 to-zinc-100 text-gray-900'
        }`}
      >
        <h3 className="text-4xl md:text-5xl font-heading font-bold capitalize text-primary dark:text-blue-400">
          Certificate not found
        </h3>
      </section>
    );
  }

  return (
    <>
      <ForceDarkMode />
      {isDesktop ? (
        <div className="h-screen">
          <Badge3D attendee={attendee} isDark={isDark} />
        </div>
      ) : (
        <div className="container">
          <div className="h-screen pt-40">
            <h1 className="bg-zinc-800 from-foreground bg-clip-text text-[12vw] font-bold tracking-tighter text-transparent dark:bg-gradient-to-b dark:to-zinc-400 md:text-8xl">
              bug.edu.vn
            </h1>
            <p className="max-w-2xl text-muted-foreground md:text-xl">
              Mobile version of 3D badge is{' '}
              <span className="font-medium text-foreground">under heavy development.</span> Changes and updates may
              happen frequently as we work to improve its functionality and features.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
