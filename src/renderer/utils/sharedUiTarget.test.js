import test from 'node:test'
import assert from 'node:assert/strict'
import { sharedUiPath, verifySharedUi } from './sharedUiTarget.js'

test('desktop can only select known routes on its verified proxy', () => {
  assert.equal(sharedUiPath('https://localhost:47990/config#input'), '/config#input')
  assert.equal(sharedUiPath('https://example.com/apps'), '/apps')
  assert.equal(sharedUiPath('https://example.com/unknown'), '/')
  assert.equal(sharedUiPath('javascript:alert(1)'), '/')
  assert.equal(sharedUiPath('https://localhost/welcome'), '/welcome')
  assert.equal(sharedUiPath('https://localhost/welcome?setup=1'), '/welcome?setup=1')
  assert.equal(sharedUiPath('https://localhost/config#help'), '/config#help')
  assert.equal(sharedUiPath('https://localhost/config#account'), '/config#account')
  assert.equal(sharedUiPath('https://localhost/pin'), '/pin')
})
test('reject an old or unavailable Web UI instead of opening a mismatched interface', async () => {
  assert.equal(await verifySharedUi('http://127.0.0.1:48081', async () => new Response('<html>Old UI</html>')), false)
  assert.equal(await verifySharedUi('http://127.0.0.1:48081', async () => new Response('<meta name="foundation-shared-ui" content="1" />')), true)
  assert.equal(await verifySharedUi('http://127.0.0.1:48081', async () => new Response('', { status: 503 })), false)
})
