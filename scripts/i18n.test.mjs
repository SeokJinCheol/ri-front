import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { readTranslations, validateTranslationRows, translationsPlugin, workbookPath } from './i18n-workbook.mjs'
import { readLocale, translate } from '../src/i18n/core.ts'

const header = ['key', 'ko', 'en']
test('reads the Excel source and covers every translation used by the UI', async () => {
    const dictionaries = await readTranslations()
    assert.equal(dictionaries.ko['nav.documents'], '문서')
    assert.equal(dictionaries.en['nav.documents'], 'Documents')
    for (const file of await readdir(new URL('../src', import.meta.url), { recursive: true })) {
        if (!/\.tsx?$/.test(file)) continue
        const code = await readFile(new URL('../src/' + file, import.meta.url), 'utf8')
        for (const [, key] of code.matchAll(/\bt\(["']([^"']+)["']/g)) {
            assert.ok(dictionaries.ko[key], `${file}: missing Korean ${key}`)
            assert.ok(dictionaries.en[key], `${file}: missing English ${key}`)
        }
    }
})
test('rejects invalid workbooks before shipping incomplete translations', () => {
    for (const [rows, error] of [
        [[['id', 'ko', 'en']], /columns/],
        [[header], /empty/],
        [[header, ['valid', '안녕', 'Hello'], ['valid', '안녕', 'Hello']], /duplicate/],
        [[header, ['valid', '안녕', '']], /en translation/],
        [[header, ['valid', ' ', 'Hello']], /ko translation/],
        [[header, ['bad key', '안녕', 'Hello']], /invalid/],
        [[header, ['valid', '{{count}}개', '{{total}} items']], /placeholders/],
    ]) assert.throws(() => validateTranslationRows(rows), error)
})
test('interpolates reordered values safely and falls back predictably', () => {
    const dictionaries = validateTranslationRows([header, ['count', '{{name}}: {{count}}개', '{{count}} items for {{name}}']])
    assert.equal(translate(dictionaries, 'en', 'count', { name: '$& <hello>', count: 0 }), '0 items for $& <hello>')
    assert.equal(translate(dictionaries, 'ko', 'count', { name: '문서', count: 2 }), '문서: 2개')
    delete dictionaries.en.count
    assert.equal(translate(dictionaries, 'en', 'count', { name: 'A', count: 2 }), 'A: 2개')
    assert.equal(translate(dictionaries, 'en', 'unknown'), 'unknown')
})
test('restores only supported locales and tolerates unavailable storage', () => {
    assert.equal(readLocale({ getItem: () => 'en' }, 'locale', 'ko'), 'en')
    for (const value of [null, '', 'fr', 'undefined']) assert.equal(readLocale({ getItem: () => value }, 'locale', 'ko'), 'ko')
    assert.equal(readLocale({ getItem: () => { throw new Error('denied') } }, 'locale', 'ko'), 'ko')
})
test('Excel changes invalidate the generated module and reload the development app', async () => {
    const plugin = translationsPlugin()
    const module = {}
    const events = []
    await plugin.handleHotUpdate({ file: workbookPath, server: {
        moduleGraph: { getModuleById: () => module, invalidateModule: (value) => events.push(value) },
        ws: { send: (value) => events.push(value) },
    } })
    assert.deepEqual(events, [module, { type: 'full-reload' }])
})
