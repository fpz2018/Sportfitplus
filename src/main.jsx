import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// ─── Service worker recovery helpers ────────────────────────────────────────
// Bij een nieuwe deploy kan de oude service worker een gecachte index.html
// serveren die naar chunk-hashes verwijst die niet meer bestaan. Dat resulteert
// in een eindeloos draaiende Suspense-fallback. Onderstaande helpers vangen
// dat op door eenmalig te herladen, of in het ergste geval de SW te
// deregistreren en hard te herladen.

const RECOVERY_KEY = 'sw-recovery-attempted';

async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    if (window.caches?.keys) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(k => window.caches.delete(k)));
    }
  } catch {
    // Ignore — we vallen sowieso terug op reload.
  }
}

function recoverFromStaleChunks() {
  // Maximaal één recovery-poging per sessie om reload-loops te voorkomen.
  if (sessionStorage.getItem(RECOVERY_KEY)) return;
  sessionStorage.setItem(RECOVERY_KEY, '1');
  unregisterServiceWorkers().finally(() => {
    window.location.reload();
  });
}

// Ontsnappingsroute: gebruiker kan handmatig recovery forceren via ?reset=1
if (typeof window !== 'undefined' && window.location.search.includes('reset=1')) {
  unregisterServiceWorkers().finally(() => {
    const url = window.location.pathname;
    window.location.replace(url);
  });
}

// Service worker registratie — alleen in productie, nooit blokkerend
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {});

  // Wanneer een nieuwe SW de pagina overneemt, eenmalig herladen zodat de
  // gebruiker fresh assets krijgt. We slaan de eerste install (geen vorige
  // controller) over om reload op het eerste bezoek te vermijden.
  let hadInitialController = !!navigator.serviceWorker.controller;
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return;
    if (!hadInitialController) {
      hadInitialController = !!navigator.serviceWorker.controller;
      return;
    }
    reloadedForUpdate = true;
    window.location.reload();
  });
}

// Detecteer mislukte dynamic imports (lazy chunks die niet meer bestaan na
// een deploy) en herstel automatisch.
function isChunkLoadError(message = '') {
  return (
    /Loading chunk \d+ failed/.test(message) ||
    /Failed to fetch dynamically imported module/.test(message) ||
    /error loading dynamically imported module/.test(message) ||
    /Importing a module script failed/.test(message)
  );
}

window.addEventListener('error', (event) => {
  const msg = event?.message || event?.error?.message || '';
  if (isChunkLoadError(msg)) {
    recoverFromStaleChunks();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || String(event?.reason || '');
  if (isChunkLoadError(msg)) {
    recoverFromStaleChunks();
  }
});

// Vangnet: als React crasht, toon foutmelding i.p.v. wit scherm
const root = document.getElementById('root');
try {
  ReactDOM.createRoot(root).render(<App />);
} catch (err) {
  root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#888"><p>Er ging iets mis. Probeer de pagina te herladen.</p></div>';
}

// Vang onverwachte fouten op die React niet vangt
window.addEventListener('error', () => {
  if (root && !root.children.length) {
    root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#888"><p>Er ging iets mis. Probeer de pagina te herladen.</p></div>';
  }
});
