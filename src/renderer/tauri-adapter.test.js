import assert from 'node:assert/strict'
import test from 'node:test'

import { isAllowedExternalUrl, vdd } from './tauri-adapter.js'

test('external URL validation rejects local paths and unapproved protocols', () => {
  assert.equal(isAllowedExternalUrl('https://example.com'), true)
  assert.equal(isAllowedExternalUrl('HTTP://localhost:47990'), true)
  assert.equal(isAllowedExternalUrl('ms-windows-store://pdp/?ProductId=example'), true)
  assert.equal(isAllowedExternalUrl('C:\\Windows\\System32'), false)
  assert.equal(isAllowedExternalUrl('file:///C:/Windows/System32'), false)
  assert.equal(isAllowedExternalUrl('shell:AppsFolder/example'), false)
})

test('sample preview cannot forward driver writes to native IPC', async () => {
  const previousWindow = globalThis.window
  let nativeCalls = 0
  globalThis.window = {
    location: { hostname:'127.0.0.1' },
    __FOUNDATION_PREVIEW_SAMPLE__: true,
    __TAURI_INTERNALS__: { invoke: () => { nativeCalls++; throw new Error('Unexpected native command') } },
  }
  try {
    const result = await vdd.saveSettings({ monitors:{ count:1 } })
    assert.equal(result.success, false)
    assert.match(String(result.message), /Read-only UI preview/)
    assert.equal(nativeCalls, 0)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
