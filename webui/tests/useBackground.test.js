import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = (await readFile(new URL('../composables/useBackground.js', import.meta.url), 'utf8'))
  .replace(/^import .*\r?\n/gm, '')
  .replace('export function useBackground', 'function useBackground')

function harness(saved) {
  const storage = new Map(saved === undefined ? [] : [['customBackground', saved]])
  const classes = { remove() {}, add() {} }
  const body = { style: { background: 'previous background' }, classList: classes }
  const context = vm.createContext({
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      removeItem: key => storage.delete(key),
    },
    document: {
      body,
      documentElement: { style: { removeProperty() {} }, classList: classes },
    },
    window: { addEventListener() {} },
    MutationObserver: class { observe() {} },
    getCurrentScope: () => null,
    translateFallback: key => key,
  })
  vm.runInContext(source, context)
  return { background: context.useBackground(), body, storage }
}

test('a fresh profile uses theme colors without requesting a background image', async () => {
  const { background, body } = harness()
  assert.equal(background.getCurrentBackground(), '')
  await background.loadBackground()
  assert.equal(body.style.background, '')
})

test('legacy remote backgrounds are ignored when opening the interface', async () => {
  const { background, body } = harness('https://legacy.example/background.webp')
  assert.equal(background.getCurrentBackground(), '')
  await background.loadBackground()
  assert.equal(body.style.background, '')
})

test('local custom backgrounds remain available and clearing restores the theme', async () => {
  const custom = 'data:image/png;base64,example'
  const { background, body, storage } = harness(custom)
  assert.equal(background.getCurrentBackground(), custom)
  await background.clearBackground()
  assert.equal(storage.has('customBackground'), false)
  assert.equal(background.getCurrentBackground(), '')
  assert.equal(body.style.background, '')
})
