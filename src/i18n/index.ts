import dictionaries from 'virtual:translations'
import { translate, type Locale, type TranslationParams } from './core'

let currentLocale: Locale = 'ko'
export function setTranslationLocale(locale: Locale) { currentLocale = locale }
// Used by stores and non-React helpers when constructing a new message.
export const t = (key: string, params?: TranslationParams) => translate(dictionaries, currentLocale, key, params)
export const translateForLocale = (locale: Locale, key: string, params?: TranslationParams) => translate(dictionaries, locale, key, params)
