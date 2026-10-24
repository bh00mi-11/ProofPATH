import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, STORAGE_KEY_LANGUAGE } from '@/i18n/types';
import { translations, TranslationKeys } from '@/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationKeys;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load persisted language preference on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY_LANGUAGE) as SupportedLanguage | null;
        if (stored && (stored === 'en' || stored === 'hi' || stored === 'mr')) {
          setLanguageState(stored);
        }
      }
    } catch {
      // Ignore localStorage errors in non-browser or sandbox environments
    }
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
      }
    } catch {
      // Ignore write errors
    }
  }, []);

  // Use active translation dictionary with strict fallback to English
  const currentTranslations = translations[language] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: currentTranslations,
        availableLanguages: SUPPORTED_LANGUAGES,
      }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
