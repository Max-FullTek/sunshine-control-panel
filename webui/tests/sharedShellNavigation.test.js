import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { parse, compileScript } from '@vue/compiler-sfc'
import { ref } from 'vue'

const { descriptor } = parse(readFileSync(new URL('../components/layout/SharedShell.vue', import.meta.url), 'utf8'))
const compiled = compileScript(descriptor, { id: 'shared-shell-navigation' })
let script = descriptor.scriptSetup.content
for (const node of [...compiled.scriptSetupAst].reverse()) {
  if (node.type === 'ImportDeclaration') script = script.slice(0, node.start) + script.slice(node.end)
}
script += '\nglobalThis.model = { accountOpen, path, closeAccount };'

async function createShell(hash = '') {
  const location = { pathname: '/config', search: '?sample=1', hash }
  const listeners = new Map()
  let mount, unmount
  const context = vm.createContext({
    ref, watch() {}, setShellLocale() {}, hasDesktopRuntime: () => false,
    useLogout: () => ({ logout() {} }),
    useShellI18n: () => ({ locale: ref('en') }),
    useWebI18n: () => ({ locale: ref('en'), setLocaleMessage() {}, t: key => key }),
    useBackground: () => ({ loadBackground() {} }),
    location,
    history: { replaceState(_state, _title, url) { location.hash = new URL(url, 'http://localhost').hash } },
    document: { documentElement: { dataset: {} } },
    window: { __FOUNDATION_PREVIEW_SAMPLE__: true,
      addEventListener: (event, handler) => listeners.set(event, handler),
      removeEventListener: (event, handler) => { if (listeners.get(event) === handler) listeners.delete(event) },
    },
    onMounted: fn => { mount = fn }, onUnmounted: fn => { unmount = fn },
    setTimeout: () => 1, clearTimeout() {},
  })
  vm.runInContext(script, context)
  await mount()
  return { model: context.model, location, listeners, unmount }
}

test('back and forward navigation close and reopen the account dialog with the URL', async () => {
  const shell = await createShell('#account')
  assert.equal(shell.model.accountOpen.value, true)
  shell.location.hash = ''
  shell.listeners.get('popstate')()
  assert.equal(shell.model.accountOpen.value, false)
  assert.equal(shell.model.path.value, '/config?sample=1')
  shell.location.hash = '#account'
  shell.listeners.get('hashchange')()
  assert.equal(shell.model.accountOpen.value, true)
  shell.location.hash = '#help'
  shell.listeners.get('hashchange')()
  assert.equal(shell.model.accountOpen.value, false)
  shell.unmount()
  assert.equal(shell.listeners.size, 0)
})

test('closing the account dialog updates both the route and dialog state', async () => {
  const shell = await createShell('#account')
  shell.model.closeAccount()
  assert.equal(shell.location.hash, '#system')
  assert.equal(shell.model.path.value, '/config?sample=1#system')
  assert.equal(shell.model.accountOpen.value, false)
  shell.unmount()
})
