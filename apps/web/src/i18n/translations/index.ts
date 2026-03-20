import type { Locale, TranslationKeys } from '../types';
import { en } from './en';
import { ko } from './ko';
import { ja } from './ja';

export const translations: Record<Locale, TranslationKeys> = {
  en,
  ko,
  ja,
};
