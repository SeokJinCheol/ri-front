import readXlsxFile from 'read-excel-file/node'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const workbookPath = fileURLToPath(new URL('../translations/translations.xlsx', import.meta.url))
const virtualId = 'virtual:translations'
const resolvedId = '\0' + virtualId
const placeholders = (value) => [...new Set([...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]))].sort().join(',')

export async function readTranslations(filename = workbookPath) {
    const sheets = await readXlsxFile(filename, { sheet: 'Translations', trim: false })
    const rows = sheets.find((sheet) => sheet.sheet === 'Translations')?.data
    if (!rows) throw new Error('Translations worksheet is required')
    return validateTranslationRows(rows)
}

export function validateTranslationRows(rows) {
    const headers = rows[0]?.slice(0, 3) ?? []
    if (headers.join(',') !== 'key,ko,en') throw new Error('Translation columns must start with key, ko, en')
    const dictionaries = { ko: Object.create(null), en: Object.create(null) }
    rows.slice(1).forEach((row, offset) => {
        const index = offset + 2
        if (row.every((value) => value == null || value === '')) return
        const [key, ko, en] = row
        if (typeof key !== 'string' || !/^[a-zA-Z][\w.-]*$/.test(key)) throw new Error(`Row ${index}: invalid translation key`)
        if (Object.hasOwn(dictionaries.ko, key)) throw new Error(`Row ${index}: duplicate key ${key}`)
        for (const [locale, value] of [['ko', ko], ['en', en]]) {
            if (typeof value !== 'string' || !value.trim()) throw new Error(`Row ${index}: ${key} has no plain-text ${locale} translation`)
            dictionaries[locale][key] = value
        }
        if (placeholders(ko) !== placeholders(en)) throw new Error(`Row ${index}: ${key} has mismatched placeholders`)
    })
    if (!Object.keys(dictionaries.ko).length) throw new Error('Translation workbook is empty')
    return dictionaries
}

export function translationsPlugin() {
    let dictionaries
    return {
        name: 'excel-translations',
        async buildStart() {
            dictionaries = await readTranslations()
            this.addWatchFile(workbookPath)
        },
        resolveId(id) { if (id === virtualId) return resolvedId },
        async load(id) {
            if (id !== resolvedId) return
            dictionaries = await readTranslations()
            return `export default ${JSON.stringify(dictionaries)}`
        },
        transform(code, id) {
            if (!id.includes('/src/') || !/\.[jt]sx?$/.test(id)) return
            for (const match of code.matchAll(/\bt\(["']([^"']+)["']/g)) {
                if (!Object.hasOwn(dictionaries.ko, match[1])) this.error(`Missing translation key: ${match[1]} (${id})`)
            }
        },
        async handleHotUpdate(context) {
            if (path.resolve(context.file) !== workbookPath) return
            dictionaries = await readTranslations()
            const module = context.server.moduleGraph.getModuleById(resolvedId)
            if (module) context.server.moduleGraph.invalidateModule(module)
            context.server.ws.send({ type: 'full-reload' })
            return []
        },
    }
}
