import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setTranslationLocale, translateForLocale } from '@/i18n'
import { isLocale, readLocale, type Locale, type TranslationParams } from '@/i18n/core'

export type { Locale } from '@/i18n/core'
interface LocaleContextType {
    locale: Locale
    dateLocale: string
    setLocale: (locale: Locale) => void
    t: (key: string, params?: TranslationParams) => string
}
const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children, defaultLocale = 'ko', storageKey = 'app-locale' }: {
    children: ReactNode; defaultLocale?: Locale; storageKey?: string
}) {
    const [locale, updateLocale] = useState<Locale>(() => {
        let initial = defaultLocale
        try { initial = readLocale(window.localStorage, storageKey, defaultLocale) } catch { /* Storage may be disabled. */ }
        setTranslationLocale(initial)
        return initial
    })
    const setLocale = useCallback((next: Locale) => {
        if (!isLocale(next)) return
        setTranslationLocale(next)
        updateLocale(next)
        try { localStorage.setItem(storageKey, next) } catch { /* Switching still works without storage. */ }
    }, [storageKey])
    useEffect(() => { document.documentElement.lang = locale }, [locale])
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== storageKey && event.key !== null) return
            const next = isLocale(event.newValue) ? event.newValue : defaultLocale
            setTranslationLocale(next)
            updateLocale(next)
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [storageKey, defaultLocale])
    const value = useMemo(() => ({
        locale, dateLocale: locale === 'ko' ? 'ko-KR' : 'en-US', setLocale,
        t: (key: string, params?: TranslationParams) => translateForLocale(locale, key, params),
    }), [locale, setLocale])
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
    const context = useContext(LocaleContext)
    if (!context) throw new Error('useLocale must be used within a LocaleProvider')
    return context
}
