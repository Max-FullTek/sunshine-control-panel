import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTheme, themePresets } from './themePresets.js'

test('legacy custom presets migrate to a fixed theme without restoring arbitrary CSS', () => {
  assert.equal(normalizeTheme('light'), 'light')
  for (const preset of ['cyberpunk', 'midnight', 'custom', null, '__proto__']) {
    assert.equal(normalizeTheme(preset), 'dark')
  }
  assert.deepEqual(Object.keys(themePresets.light).sort(), Object.keys(themePresets.dark).sort())
})
