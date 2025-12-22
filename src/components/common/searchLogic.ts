// searchLogic.ts
import { animate } from 'motion';

export function initializeSearch() {
  class SiteSearch extends HTMLElement {
    private pagefindLoaded = false;
    private cssLoaded = false;

    constructor() {
      super();

      const openBtn = this.querySelector<HTMLButtonElement>('button[data-open-modal]');
      const closeBtn = this.querySelector<HTMLButtonElement>('button[data-close-modal]');
      const dialog = this.querySelector('dialog');
      const dialogFrame = this.querySelector('.dialog-frame');

      if (!openBtn || !closeBtn || !dialog || !dialogFrame) {
        return;
      }

      const toggleRain = (visible: boolean) => {
        const rain = document.getElementById('matrix-rain');
        if (!rain) return;
        const fromClass = visible ? 'hidden' : 'visible';
        const toClass = visible ? 'visible' : 'hidden';
        if (rain.classList.contains(fromClass)) {
          rain.classList.replace(fromClass, toClass);
        } else {
          rain.classList.add(toClass);
          rain.classList.remove(fromClass);
        }
      };

      const closeModal = () => {
        dialog.close();
        dialog.classList.add('opacity-0');
        document.body.classList.remove('overflow-hidden');
        window.removeEventListener('click', onWindowClick);
        window.removeEventListener('keydown', handleEscKey);
        toggleRain(false);
      };

      const onWindowClick = (event: MouseEvent) => {
        const target = event.target as Node | null;
        if (target && !dialogFrame.contains(target) && dialog.open) {
          closeModal();
        }
      };

      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && dialog.open) {
          closeModal();
        }
      };

      // Lazy load Pagefind CSS
      const loadPagefindCSS = () => {
        if (this.cssLoaded) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/pagefind/pagefind-ui.css';
        document.head.appendChild(link);

        this.cssLoaded = true;
      };

      // Lazy load Pagefind JS and initialize
      const loadPagefind = async () => {
        if (this.pagefindLoaded || import.meta.env.DEV) return;

        this.pagefindLoaded = true;

        try {
          const { PagefindUI } = await import('@pagefind/default-ui');
          new PagefindUI({
            element: '#pagefind__search',
            baseUrl: import.meta.env.BASE_URL,
            bundlePath: import.meta.env.BASE_URL.replace(/\/$/, '') + '/pagefind/',
            showImages: true,
            resetStyles: false,
            processResult: (result) => {
              result.url = result.url.replace(/\/$/, '');
              return result;
            },
          });
        } catch (error) {
          console.error('Failed to load Pagefind:', error);
        }
      };

      const openModal = async (event?: MouseEvent) => {
        // Load CSS and JS on first open
        loadPagefindCSS();
        loadPagefind();

        dialog.showModal();

        toggleRain(true);

        animate(
          dialog,
          {
            clipPath: ['polygon(0 0, 100% 0, 100% -200%, -200% -200%)', 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)'],
            opacity: [0, 1],
          },
          { duration: 0.2 }
        );

        dialog.classList.remove('opacity-0');
        document.body.classList.add('overflow-hidden');

        this.querySelector('input')?.focus();
        event?.stopPropagation();

        window.addEventListener('click', onWindowClick);
        window.addEventListener('keydown', handleEscKey);
      };

      openBtn.addEventListener('click', openModal);
      openBtn.disabled = false;
      closeBtn.addEventListener('click', closeModal);

      // Clean up on navigate
      document.addEventListener('astro:before-swap', closeModal, { once: true });
    }

    connectedCallback() {
      // Custom element is now in the DOM
    }

    disconnectedCallback() {
      // Cleanup if necessary
    }
  }

  if (!customElements.get('site-search')) {
    customElements.define('site-search', SiteSearch);
  }
}
