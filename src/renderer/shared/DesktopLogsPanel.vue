<template>
  <section class="desktop-logs" :aria-label="text.desktop">
    <header class="dlog-header">
      <h2>{{ text.desktop }}</h2>
      <div class="dlog-actions">
        <button type="button" @click="refresh" :disabled="loading">{{ labels.refresh }}</button>
        <button type="button" @click="download" :disabled="preview || downloading">{{ text.download }}</button>
      </div>
    </header>
    <p>{{ text.description }}</p>
    <p v-if="preview">{{ text.sample }}</p>
    <p v-if="storagePath" class="dlog-path">{{ text.path }}: <code>{{ storagePath }}</code></p>
    <p v-if="storageError" role="alert">{{ text.storageFailure }}: {{ storageError }}</p>
    <p v-if="error" role="alert">{{ text.failure }}: {{ error }}</p>
    <div class="dlog-controls">
      <input v-model="search" type="search" :placeholder="labels.searchPlaceholder" :aria-label="labels.searchPlaceholder" />
      <select v-model="level" :aria-label="text.level">
        <option value="">{{ text.all }}</option>
        <option v-for="value in levels" :key="value" :value="value">{{ value.toUpperCase() }}</option>
      </select>
    </div>
    <pre class="dlog-content" tabindex="0" :aria-label="text.desktop">{{ content || (loading ? labels.loadingLogs : text.empty) }}</pre>
  </section>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from '../desktop/i18n/index.js'
import { isNativeUiPreview } from './preview.js'
import { desktopLogText, formatDesktopLogs } from './desktop-logs.js'
const { t, locale } = useI18n()
const labels = computed(() => t.value.logConsole)
const text = computed(() => desktopLogText[locale.value] || desktopLogText.en)
const preview = isNativeUiPreview()
const entries = ref([]), search = ref(''), level = ref(''), error = ref(''), storagePath = ref(''), storageError = ref('')
const loading = ref(false), downloading = ref(false)
const levels = ['error', 'warn', 'info', 'debug', 'trace']
const content = computed(() => formatDesktopLogs(entries.value, { search: search.value, level: level.value }))
let timer, disposed = false
const invoke = (command, args) => window.__TAURI_INTERNALS__.invoke(command, args)
async function refresh() {
  if (loading.value || disposed) return
  loading.value = true
  try {
    const snapshot = preview
      ? { entries: window.__FOUNDATION_CONSOLE_PREVIEW_LOGS__ || [] }
      : await invoke('get_desktop_log_snapshot')
    if (disposed) return
    entries.value = snapshot.entries
    storagePath.value = snapshot.storagePath || ''
    storageError.value = snapshot.storageError || ''
    error.value = ''
  } catch (cause) { if (!disposed) error.value = String(cause) }
  finally { loading.value = false }
}
async function download() {
  if (preview || downloading.value) return
  downloading.value = true
  try {
    const archive = await invoke('get_desktop_log_archive')
    await invoke('save_text_file', {
      content: archive, defaultName: `foundation-desktop-${new Date().toISOString().replaceAll(':', '-')}.jsonl`,
      filterName: 'JSON Lines', extensions: ['jsonl'],
    })
    error.value = ''
  } catch (cause) { if (cause !== 'cancelled') error.value = String(cause) }
  finally { downloading.value = false }
}
onMounted(() => { refresh(); timer = setInterval(refresh, 5000) })
onBeforeUnmount(() => { disposed = true; clearInterval(timer) })
</script>
<style scoped>
.desktop-logs { padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid var(--ui-border); border-radius: 14px; background: var(--ui-surface); color: var(--ui-text-primary); }
.dlog-header, .dlog-actions, .dlog-controls { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; }
.dlog-header { justify-content: space-between; margin-bottom: 1rem; }
h2 { font-size: 1.15rem; margin: 0; font-weight: 600; }
p { color: var(--ui-text-secondary); font-size: .9rem; margin: 0 0 1rem; }
.dlog-path { overflow-wrap: anywhere; }
code { color: inherit; }
button, input, select { font: inherit; border: 1px solid var(--ui-border-strong); border-radius: 8px; padding: .5rem .8rem; }
button { background: var(--ui-action-primary); color: var(--ui-action-contrast); cursor: pointer; font-weight: 500; }
button:disabled { opacity: .55; cursor: default; }
input, select { background: var(--ui-page-bg); color: var(--ui-text-primary); min-width: 0; }
input { flex: 1; }
:focus-visible { outline: 2px solid var(--ui-accent-text); outline-offset: 3px; }
.dlog-content { background: var(--ui-page-bg); color: var(--ui-text-primary); padding: 1rem; border-radius: 8px; margin: 1rem 0 0; max-height: 440px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.7 Consolas, monospace; }
[role=alert] { color: var(--ui-danger-text); }
</style>
