import { en } from './en';
import { ar } from './ar';

export type Lang = 'en' | 'ar';
export type TranslationKey = keyof typeof en;

export const translations = { en, ar } as const;

export function t(key: TranslationKey, lang: Lang = 'en', vars?: Record<string, string>): string {
  const dict = translations[lang] as Record<string, string>;
  let text = dict[key] ?? (translations['en'] as Record<string, string>)[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  return text;
}
