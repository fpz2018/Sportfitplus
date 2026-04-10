import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from '@/App.jsx'
import '@/index.css'

// Registreer service worker met auto-update
// Bij een nieuwe SW versie wordt de pagina automatisch herladen
registerSW({
  onNeedRefresh() {
    // Nieuwe content beschikbaar — herlaad direct
    window.location.reload();
  },
  onOfflineReady() {
    console.log('Sportfit Plus is beschikbaar offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
