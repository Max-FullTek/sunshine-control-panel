import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDesktopLogs, desktopLogText, hasDesktopLogAccess } from './desktop-logs.js'

test('desktop log filters include source and preserve multiline and literal markup safely as text', () => {
  const entries = [
    { timestamp: 'today', level: 'info', file: 'app.rs', line: 2, message: '<script>\nReady' },
    { timestamp: 'today', level: 'warn', target: 'proxy', message: 'Unavailable' },
  ]
  assert.equal(formatDesktopLogs(entries, { search: 'APP.RS', level: 'info' }), '[today] [INFO] app.rs:2 <script>\nReady')
  assert.equal(formatDesktopLogs(entries, { search: 'unavailable', level: 'info' }), '')
  assert.equal(formatDesktopLogs(entries, { level: 'warn' }), '[today] [WARN] proxy Unavailable')
  for (const locale of ['zh', 'zh_TW']) assert.deepEqual(Object.keys(desktopLogText[locale]), Object.keys(desktopLogText.en))
})

test('ordinary browsers never expose local desktop logs', () => {
  assert.equal(hasDesktopLogAccess({ location: { hostname: 'localhost' } }), false)
  assert.equal(hasDesktopLogAccess({ __TAURI_INTERNALS__: {} }), false)
  assert.equal(hasDesktopLogAccess({ __TAURI_INTERNALS__: { invoke() {} } }), true)
})
