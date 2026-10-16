import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { en } from '../desktop/i18n/en.js'
import { zh } from '../desktop/i18n/zh.js'
import { formatMessage } from '../shared/format-message.js'

// Execute the composable with inert UI/Tauri boundaries: never download or launch a tool.
const source = fs.readFileSync(new URL('./useTools.js', import.meta.url), 'utf8')
  .replace(/^import .*\r?\n/gm, '')
  .replace('export function useTools()', 'function useTools()')
  .replace(/import\('(@tauri-apps\/api\/[^']+)'\)/g, 'loadTauri("$1")')

function harness(messages = en, options = {}) {
  const calls = { dialogs: [], messages: [], urls: [], loads: [], downloads: [], launches: 0 }
  let progressListener
  let unlistened = false
  const t = { value: messages }
  const loading = { setText: (text) => calls.loads.push(text), close() {} }
  const ElMessage = (options) => { calls.messages.push(options.message); return loading }
  for (const type of ['info', 'success', 'error', 'warning']) {
    ElMessage[type] = (message) => calls.messages.push(message)
  }
  const ElMessageBox = async (config) => {
    calls.dialogs.push(config)
    if (options.choice === 'cancel' || options.choice === 'close') throw options.choice
    return 'confirm'
  }
  ElMessageBox.confirm = async (message, title, config) => {
    calls.dialogs.push({ message, title, ...config })
    return 'confirm'
  }
  ElMessageBox.alert = async (message, title, config) => {
    calls.dialogs.push({ message, title, ...config })
    return 'confirm'
  }
  const api = vm.runInNewContext(`${source}\nuseTools()`, {
    ref: (value) => ({ value }), useI18n: () => ({ t }), formatMessage,
    ElMessage, ElMessageBox, ElNotification: (config) => calls.dialogs.push(config),
    ElLoading: { service: (config) => { calls.loads.push(config.text); return loading } },
    openExternalUrl: async (url) => calls.urls.push(url), tools: {},
    console: { error() {}, warn() {}, log() {} },
    loadTauri: async () => ({
      listen: async (_, listener) => { progressListener = listener; return () => { unlistened = true } },
      invoke: async (command) => command === 'is_running_as_admin' ? true : {
        success: true, deleted_count: options.deletedCount ?? 2, freed_space: 2048,
        message: '成功删除无用文件',
      },
    }),
  })
  return { api, calls, t, unlistened: () => unlistened }
}

test('cleanup formats counters locally instead of displaying backend Chinese text', async () => {
  for (const deletedCount of [0, 2]) {
    const { api, calls } = harness(en, { deletedCount })
    await api.cleanupCovers()
    assert.doesNotMatch(JSON.stringify(calls), /\p{Script=Han}/u)
    if (deletedCount) assert.match(calls.dialogs.at(-1).message, /Deleted files: 2\nFreed space: 2\.00 KB/)
    else assert.equal(calls.messages.at(-1), en.toolActions.cleanupEmpty)
  }
})

test('new translations have matching keys and placeholder names in both supported locales', () => {
  for (const section of ['toolActions', 'windowActions', 'routeTitles']) {
    assert.deepEqual(Object.keys(en[section]).sort(), Object.keys(zh[section]).sort())
    for (const key of Object.keys(en[section])) {
      assert.deepEqual(en[section][key].match(/\{\w+\}/g), zh[section][key].match(/\{\w+\}/g))
    }
  }
})

test('message formatting preserves dollar signs and braces in user-provided values', () => {
  assert.equal(formatMessage('{name}: {count}', { name: '$& {count}', count: 2 }), '$& {count}: 2')
})
