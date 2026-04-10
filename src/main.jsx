import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Service worker registratie — alleen in productie, nooit blokkerend
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {});
}

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
