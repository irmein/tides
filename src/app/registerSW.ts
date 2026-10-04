/**
 * Service Worker registration using virtual:pwa-register
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[Tides PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          // In development or sandbox without sw.js generated, ignore quietly
          console.debug('[Tides PWA] SW registration notice:', err);
        });
    });
  }
}
