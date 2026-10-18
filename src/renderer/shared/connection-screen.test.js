import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { connectionLocale, initialConnectionLocale, connectionMessages, mountConnectionScreen, probeConnection, retryDelay } from './connection-screen.js'

test('connection locale follows explicit interface choice before cached or system locale', () => {
  const values = { 'foundation-interface-locale': 'zh_TW', language: 'en' }
  assert.equal(initialConnectionLocale({ getItem: key => values[key] }, 'zh-CN'), 'zh_TW')
  assert.equal(initialConnectionLocale({ getItem() { throw Error('blocked') } }, 'zh-HK'), 'zh_TW')
  assert.equal(connectionLocale('zh_CN'), 'zh')
  assert.equal(connectionLocale('de'), 'en')
  for (const locale of ['zh_TW', 'zh', 'en']) {
    assert.deepEqual(Object.keys(connectionMessages[locale]), Object.keys(connectionMessages.en))
    for (const value of Object.values(connectionMessages[locale])) assert.ok(value.length)
  }
})

test('temporary restart failures cannot be mistaken for incompatible Web UI', async () => {
  for (const status of [401, 502, 503]) {
    assert.equal(await probeConnection('/apps', { request: async () => new Response('Unavailable', { status }) }), 'waiting')
  }
  assert.equal(await probeConnection('/apps', { request: async () => new Response('<meta name="foundation-shared-ui" content="1" />') }), 'ready')
  assert.equal(await probeConnection('/apps', { request: async () => new Response('<html>Older UI</html>') }), 'mismatch')
  await assert.rejects(probeConnection('/apps', { request: async () => { throw Error('refused') } }), /refused/)
})

test('retry backoff remains bounded and preserves cancellation and requested URL', async () => {
  assert.equal(retryDelay(0), 1000)
  assert.equal(retryDelay(9), 1000)
  assert.equal(retryDelay(10), 5000)
  assert.equal(retryDelay(14), 30000)
  const controller = new AbortController()
  await probeConnection('/apps?example=1', { signal: controller.signal, request: async (url, options) => {
    assert.equal(url, '/apps?example=1')
    assert.equal(options.signal, controller.signal)
    assert.equal(options.cache, 'no-store')
    return new Response('', { status: 503 })
  } })
})

test('both desktop and offline proxy embed the same markup, styles and controller', () => {
  const desktop = readFileSync(new URL('../components/SunshineFrame.vue', import.meta.url), 'utf8')
  const proxy = readFileSync(new URL('../../../src-tauri/src/proxy_server.rs', import.meta.url), 'utf8')
  for (const extension of ['html', 'css', 'js']) {
    assert.ok(desktop.includes(`connection-screen.${extension}`))
    assert.ok(proxy.includes(`connection-screen.${extension}`))
  }
  const markup = readFileSync(new URL('./connection-screen.html', import.meta.url), 'utf8')
  assert.ok(markup.includes('Foundation Sunshine Lite'))
  assert.ok(!markup.includes('data-lucide'), 'fallback icons work without network assets')
})

function connectionHost(t) {
  const elements = new Map()
  const element = key => {
    if (!elements.has(key)) elements.set(key, {
      style: { setProperty() {} }, dataset: { angle: '44' },
      classList: { toggle() {} }, setAttribute() {}, addEventListener() {}, removeEventListener() {},
    })
    return elements.get(key)
  }
  const root = { style: {}, dataset: {}, querySelector: element, querySelectorAll: () => [element('target')] }
  for (const [key, value] of Object.entries({
    window: { addEventListener() {}, removeEventListener() {} },
    localStorage: { getItem() { return null } },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : delete globalThis[key])
  }
  return { querySelector: () => root, root }
}

test('automatic recovery retries and navigates only after verified success', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const host = connectionHost(t)
  let attempts = 0, navigations = 0
  const screen = mountConnectionScreen(host, {
    locale: 'en', probe: async () => ++attempts === 1 ? 'waiting' : 'ready', onReady: () => navigations++,
  })
  await Promise.resolve()
  assert.equal(host.root.dataset.found, 'false')
  t.mock.timers.tick(1000)
  await Promise.resolve()
  assert.equal(attempts, 2)
  assert.equal(host.root.dataset.found, 'true')
  assert.equal(navigations, 0)
  t.mock.timers.tick(650)
  assert.equal(navigations, 1)
  screen.dispose()
})

test('a disposed screen aborts its probe and ignores late success', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const host = connectionHost(t)
  let finish, activeSignal, navigations = 0
  const screen = mountConnectionScreen(host, {
    locale: 'zh_TW', probe: signal => { activeSignal = signal; return new Promise(resolve => { finish = resolve }) },
    onReady: () => navigations++,
  })
  screen.dispose()
  assert.equal(activeSignal.aborted, true)
  finish('ready')
  await Promise.resolve()
  t.mock.timers.tick(10000)
  assert.equal(navigations, 0)
  assert.equal(host.root.dataset.found, 'false')
})
