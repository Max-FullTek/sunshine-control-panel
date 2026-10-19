<template>
  <main class="diagnostic-window">
    <header><h1>{{ text.title }}</h1><button type="button" v-if="!preview" @click="openPanel">{{ text.back }}</button></header>
    <p v-if="navigationError" role="alert">{{ navigationError }}</p>
    <DesktopLogsPanel />
  </main>
</template>
<script setup>
import { computed, ref, watchEffect } from 'vue'
import DesktopLogsPanel from '../shared/DesktopLogsPanel.vue'
import { desktopLogText } from '../shared/desktop-logs.js'
import { isNativeUiPreview } from '../shared/preview.js'
import { useI18n } from '../desktop/i18n/index.js'
import { useTheme } from '../desktop/composables/useTheme.js'
useTheme()
const { locale } = useI18n()
const text = computed(() => desktopLogText[locale.value] || desktopLogText.en)
const preview = isNativeUiPreview(), navigationError = ref('')
watchEffect(() => { document.title = text.value.title })
async function openPanel() {
  try { await window.__TAURI_INTERNALS__.invoke('open_tool_window', { toolName: 'diagnostics' }); navigationError.value = '' }
  catch (cause) { navigationError.value = String(cause) }
}
</script>
<style>
html, body, #app { margin: 0; min-height: 100%; background: var(--ui-page-bg); color: var(--ui-text-primary); font-family: var(--ui-font-family); }
* { box-sizing: border-box; }
.diagnostic-window { padding: 24px; }
.diagnostic-window > header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 24px; flex-wrap: wrap; }
.diagnostic-window h1 { font-size: 1.5rem; margin: 0; }
.diagnostic-window > header button { font: inherit; padding: .6rem 1rem; border: 1px solid var(--ui-border-strong); border-radius: 8px; background: var(--ui-action-primary); color: var(--ui-action-contrast); cursor: pointer; }
</style>
