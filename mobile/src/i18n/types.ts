/**
 * ProofPath Localization Architecture
 * Languages: English (en - default fallback), Hindi (hi), Marathi (mr)
 * Supports persistent storage via localStorage (web) and robust fallback.
 */

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const STORAGE_KEY_LANGUAGE = 'proofpath_selected_language';
