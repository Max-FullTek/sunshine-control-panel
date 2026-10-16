import test from 'node:test'
import assert from 'node:assert/strict'
import { documentLocale, normalizeLocale, readInterfaceLocale, writeInterfaceLocale } from './locale.js'

test('Traditional Chinese variants retain their identity across host and browser formats', () => {
  for (const locale of ['zh_TW', 'zh-TW', 'zh-Hant', 'zh-Hant-TW', 'zh-HK', 'zh_MO']) {
    assert.equal(normalizeLocale(locale), 'zh_TW')
    assert.equal(documentLocale(locale), 'zh-Hant-TW')
  }
  for (const locale of ['zh', 'zh_CN', 'zh-Hans-CN']) assert.equal(normalizeLocale(locale), 'zh')
  assert.equal(normalizeLocale('en-US'), 'en')
  assert.equal(normalizeLocale(null), 'en')
})

test('explicit interface choice survives page initialization with a different host default', () => {
  const values = new Map()
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }
  assert.equal(readInterfaceLocale(storage), null)
  writeInterfaceLocale(storage, 'en')
  assert.equal(readInterfaceLocale(storage) || 'zh_TW', 'en')
  writeInterfaceLocale(storage, 'zh-TW')
  assert.equal(readInterfaceLocale(storage), 'zh_TW')
  values.set('foundation-interface-locale', '../invalid')
  assert.equal(readInterfaceLocale(storage), null)
  assert.equal(readInterfaceLocale({ getItem() { throw new Error('unavailable') } }), null)
})
