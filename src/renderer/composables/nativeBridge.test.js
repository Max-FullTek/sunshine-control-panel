import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isNativeControlPanelMessage,
  isTrustedNativeControlPanelMessage,
} from './nativeBridge.js'

test('native bridge recognizes only allowlisted control-panel requests', () => {
  assert.equal(isNativeControlPanelMessage({ type: 'native-navigation-context-request' }), true)
  assert.equal(isNativeControlPanelMessage({ type: 'native-updater-context-request' }), true)
  assert.equal(isNativeControlPanelMessage({ type: 'native-rtx-hdr-open-request' }), false)
  assert.equal(isNativeControlPanelMessage({ type: 'native-rtx-hdr-context-request' }), false)
  assert.equal(isNativeControlPanelMessage({ type: 'open-control-panel-page', target: 'anything' }), false)
  assert.equal(isNativeControlPanelMessage({ type: 'native-rtx-hdr-delete-request' }), false)
})

test('native bridge requires both trusted iframe metadata and WebUI source marker', () => {
  const request = { type: 'native-navigation-context-request', source: 'sunshine-webui' }
  assert.equal(isTrustedNativeControlPanelMessage(request, true), true)
  assert.equal(isTrustedNativeControlPanelMessage(request, false), false)
  assert.equal(
    isTrustedNativeControlPanelMessage({ ...request, source: 'untrusted-frame' }, true),
    false,
  )
})
