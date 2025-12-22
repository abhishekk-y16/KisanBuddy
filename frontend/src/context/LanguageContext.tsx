import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import TRANSLATIONS from '@/i18n/translations';

type LanguageCode = 'en' | 'hi';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  t: (key: string) => string;
}

const DEFAULT: LanguageContextValue = {
  language: 'en',
  setLanguage: () => {},
  t: (k: string) => k,
};

const LanguageContext = createContext<LanguageContextValue>(DEFAULT);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('km_lang') : null;
      return (stored as LanguageCode) || 'en';
    } catch (e) {
      return 'en';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('km_lang', language); } catch (e) {}
  }, [language]);

  const setLanguage = (l: LanguageCode) => setLanguageState(l);

  const t = useMemo(() => (key: string) => {
    return (TRANSLATIONS[language] && TRANSLATIONS[language][key]) || TRANSLATIONS['en'][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}
