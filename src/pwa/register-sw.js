/**
 * PWA Service Worker Registration & Install Prompt Handler
 */

export function initPWA() {
  // Register Service Worker if supported and not in dev hot-reload mode
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // Handle BeforeInstallPrompt event
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.style.cursor = 'pointer';
      banner.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-gold">📲 ثبت التطبيق الآن للعب بدون إنترنت</span>
          <button class="btn btn-sm btn-gold" id="trigger-install-btn" style="padding: 0.2rem 0.6rem; min-height: 32px; font-size: 0.75rem;">تثبيت</button>
        </div>
      `;

      banner.querySelector('#trigger-install-btn')?.addEventListener('click', async (evt) => {
        evt.stopPropagation();
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] Install prompt outcome:', outcome);
          deferredPrompt = null;
          banner.style.display = 'none';
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.style.display = 'none';
  });
}
