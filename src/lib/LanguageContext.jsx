import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('preferred_language');
    if (saved && translations[saved]) return saved;
    
    // Fall back to browser language
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'nl';
  });

  useEffect(() => {
    localStorage.setItem('preferred_language', language);
  }, [language]);

  const t = (key) => translations[language]?.[key] || translations.nl[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}