import test from 'node:test'
import assert from 'node:assert/strict'
import { documentLocale, normalizeLocale } from './locale.js'

test('Traditional Chinese variants retain their identity across host and browser formats', () => {
  for (const locale of ['zh_TW', 'zh-TW', 'zh-Hant', 'zh-Hant-TW', 'zh-HK', 'zh_MO']) {
    assert.equal(normalizeLocale(locale), 'zh_TW')
    assert.equal(documentLocale(locale), 'zh-Hant-TW')
  }
  for (const locale of ['zh', 'zh_CN', 'zh-Hans-CN']) assert.equal(normalizeLocale(locale), 'zh')
  assert.equal(normalizeLocale('en-US'), 'en')
  assert.equal(normalizeLocale(null), 'en')
})
