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
//
// BELANGRIJK: tijdens een Supabase magic-link flow staan one-time auth-tokens
// in de URL (#access_token=... bij implicit, ?code=... bij PKCE). Een reload
// op dat moment verbruikt de tokens en breekt de login. Alle reload-paden
// hieronder controleren daarom eerst of er een auth-flow bezig is.

const RECOVERY_TS_KEY = 'sw-recovery-ts';
const RECOVERY_COUNT_KEY = 'sw-recovery-count';
const RECOVERY_MIN_INTERVAL_MS = 3000; // anti-loop guard
const RECOVERY_MAX_PER_SESSION = 5;    // hard cap

function isAuthFlowInProgress() {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return (
    hash.includes('access_token') ||
    hash.includes('refresh_token') ||
    hash.includes('type=recovery') ||
    hash.includes('type=magiclink') ||
    /[?&]code=/.test(search)
  );
}

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
  // Niet recoveren tijdens een auth-flow: dat zou de tokens verbranden.
  if (isAuthFlowInProgress()) return;

  let lastTs = 0;
  let count = 0;
  try {
    lastTs = parseInt(sessionStorage.getItem(RECOVERY_TS_KEY) || '0', 10);
    count = parseInt(sessionStorage.getItem(RECOVERY_COUNT_KEY) || '0', 10);
  } catch {}

  const now = Date.now();
  // Anti-loop: minimaal 3s tussen pogingen
  if (now - lastTs < RECOVERY_MIN_INTERVAL_MS) return;
  // Hard cap: maximaal 5 recoveries per sessie zodat we nooit eindeloos
  // herstarten als de root-cause niet de cache is.
  if (count >= RECOVERY_MAX_PER_SESSION) return;

  try {
    sessionStorage.setItem(RECOVERY_TS_KEY, String(now));
    sessionStorage.setItem(RECOVERY_COUNT_KEY, String(count + 1));
  } catch {}

  unregisterServiceWorkers().finally(() => {
    window.location.reload();
  });
}

// Wanneer de app succesvol opgestart is (10s zonder crash) ruimen we de
// recovery-counter op zodat een toekomstige stale state opnieuw hersteld
// kan worden.
function scheduleRecoveryReset() {
  setTimeout(() => {
    try {
      sessionStorage.removeItem(RECOVERY_TS_KEY);
      sessionStorage.removeItem(RECOVERY_COUNT_KEY);
    } catch {}
  }, 10000);
}

// Ontsnappingsroute: gebruiker kan handmatig recovery forceren via ?reset=1
if (
  typeof window !== 'undefined' &&
  /[?&]reset=1(?:&|$)/.test(window.location.search) &&
  !isAuthFlowInProgress()
) {
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
  // controller) over om reload op het eerste bezoek te vermijden, en we
  // reloaden NOOIT tijdens een auth-flow.
  let hadInitialController = !!navigator.serviceWorker.controller;
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return;
    if (!hadInitialController) {
      hadInitialController = !!navigator.serviceWorker.controller;
      return;
    }
    if (isAuthFlowInProgress()) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
}

// Detecteer mislukte dynamic imports (lazy chunks die niet meer bestaan na
// een deploy) en herstel automatisch.
function isChunkLoadError(message = '') {
  return (
    /Loading chunk/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Failed to fetch dynamically imported/i.test(message) ||
    /error loading dynamically imported/i.test(message) ||
    /Importing a module script failed/i.test(message)
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

// Vite vuurt dit event af bij een mislukte modulePreload — meest betrouwbaar
// signaal voor stale chunk references na een deploy.
window.addEventListener('vite:preloadError', () => {
  recoverFromStaleChunks();
});

// Vangnet: als React crasht, toon foutmelding i.p.v. wit scherm
const root = document.getElementById('root');
try {
  ReactDOM.createRoot(root).render(<App />);
  scheduleRecoveryReset();
} catch (err) {
  root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#888"><p>Er ging iets mis. Probeer de pagina te herladen.</p></div>';
}

// Vang onverwachte fouten op die React niet vangt
window.addEventListener('error', () => {
  if (root && !root.children.length) {
    root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#888"><p>Er ging iets mis. Probeer de pagina te herladen.</p></div>';
  }
});
