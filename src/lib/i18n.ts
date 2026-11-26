import en from '../../locales/en/common.json'
import ar from '../../locales/ar/common.json'

export type Lang = 'en' | 'ar'

const dicts: Record<Lang, Record<string, string>> = {
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
}

export function translate(lang: Lang, key: string): string {
  return dicts[lang][key] ?? dicts.en[key] ?? key
}

export function loadLang(storageKey: string): Lang {
  try {
    const v = localStorage.getItem(storageKey)
    return v === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

export function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}
