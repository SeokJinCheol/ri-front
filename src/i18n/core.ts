export type Locale = 'ko' | 'en'
export type TranslationParams = Record<string, string | number | null | undefined>
export type Dictionaries = Record<Locale, Record<string, string>>

export const isLocale = (value: unknown): value is Locale => value === 'ko' || value === 'en'

export function translate(dictionaries: Dictionaries, locale: Locale, key: string, params: TranslationParams = {}): string {
    const template = dictionaries[locale][key] ?? dictionaries.ko[key] ?? key
    return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name] ?? '') : placeholder)
}

export function readLocale(storage: Pick<Storage, 'getItem'>, key: string, fallback: Locale): Locale {
    try {
        const saved = storage.getItem(key)
        return isLocale(saved) ? saved : fallback
    } catch { return fallback }
}
