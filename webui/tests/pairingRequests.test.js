import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { parse, compileScript } from '@vue/compiler-sfc'
import { ref, computed } from 'vue'

const source = readFileSync(new URL('../components/PairingRequests.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const compiled = compileScript(descriptor, { id: 'pairing-request-test' })
let script = descriptor.scriptSetup.content
for (const node of [...compiled.scriptSetupAst].reverse()) {
  if (node.type === 'ImportDeclaration') script = script.slice(0, node.start) + script.slice(node.end)
}
script += '\nglobalThis.model = { refresh, submit, requests, pin, name, message, error, sending, now };'

function createModel() {
  let response = { requests: [] }
  let tick, dispose
  const writes = []
  const context = vm.createContext({
    ref, computed, nextTick: async () => {}, Date,
    defineEmits: () => () => {},
    useNavigationCopy: () => ref({ expired: 'expired', failed: 'failed', success: 'success', unavailable: 'unavailable' }),
    useI18n: () => ({ t: ref({}) }),
    apiJson: async () => { if (response instanceof Error) throw response; return response },
    apiPostJson: async (path, body) => { writes.push({ path, body }); return { status: true } },
    onMounted: fn => fn(), onUnmounted: fn => { dispose = fn },
    setInterval: fn => { tick = fn; return 1 }, clearInterval() {},
  })
  vm.runInContext(script, context)
  return { model: context.model, writes, respond: value => { response = value }, tick: () => tick(), dispose: () => dispose() }
}
const request = id => ({ id, name: `Device ${id}`, remaining_seconds: 120, received_at: Date.now(), address: '192.0.2.1' })

test('a replacement request clears the previous PIN and submission binds the displayed request', async () => {
  const state = createModel()
  await new Promise(resolve => setImmediate(resolve))
  state.respond({ requests: [request('first')] }); await state.model.refresh()
  state.model.pin.value = '1234'
  state.respond({ requests: [request('second')] }); await state.model.refresh()
  assert.equal(state.model.pin.value, '')
  assert.equal(state.model.name.value, 'Device second')
  state.model.pin.value = '5678'
  await state.model.submit()
  assert.equal(state.writes[0].body.request_id, 'second')
  assert.equal(state.writes[0].body.pin, '5678')
  assert.equal(state.model.pin.value, '')
  state.dispose()
})

test('expired and unavailable requests cannot submit a PIN', async () => {
  const state = createModel()
  await new Promise(resolve => setImmediate(resolve))
  state.respond({ requests: [request('first')] }); await state.model.refresh()
  state.model.pin.value = '1234'
  state.respond(new Error('offline')); await state.model.refresh(); await state.model.submit()
  assert.equal(state.writes.length, 0)
  state.respond({ requests: [] }); await state.model.refresh(); await state.model.submit()
  assert.equal(state.model.pin.value, '')
  assert.equal(state.model.message.value, 'expired')
  assert.equal(state.writes.length, 0)
  state.dispose()
})
