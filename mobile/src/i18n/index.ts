import { en, TranslationKeys } from './locales/en';
import { hi } from './locales/hi';
import { mr } from './locales/mr';
import { SupportedLanguage } from './types';

export const translations: Record<SupportedLanguage, TranslationKeys> = {
  en,
  hi,
  mr,
};

export { en, hi, mr };
export type { TranslationKeys, SupportedLanguage };
export * from './types';
