<template>
  <main class="connection-screen" role="status">
    <h1>Foundation Sunshine Lite Desktop</h1>
    <p>{{ mismatch ? t.runtime.matchingCoreRequired : failed ? t.sunshineFrame.proxyUnavailable : t.sunshineFrame.preparing.replace('{path}', '/') }}</p>
    <button v-if="failed" type="button" @click="connect">{{ t.sunshineFrame.retry }}</button>
  </main>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { sunshine } from '../tauri-adapter.js'
import { checkLocalProxyHealth } from '../utils/proxyHealth.js'
import { sharedUiPath, verifySharedUi } from '../utils/sharedUiTarget.js'
import { useI18n } from '../desktop/i18n/index.js'
const { t } = useI18n()
const failed = ref(false)
const mismatch = ref(false)
const connect = async () => {
  failed.value = false
  mismatch.value = false
  // Development-only browser entry; it never enables native capabilities.
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1') {
    location.replace('http://127.0.0.1:8081/')
    return
  }
  try {
    await invoke('main_panel_loading')
    await invoke('wait_for_proxy_ready')
    const health = await invoke('get_proxy_health_check')
    if (!await checkLocalProxyHealth(health)) throw new Error('Local proxy verification failed')
    const proxy = new URL(await sunshine.getProxyUrl())
    const verified = new URL(health.url)
    if (proxy.origin !== verified.origin) throw new Error('Proxy identity changed')
    await sunshine.refreshTarget()
    if (!await verifySharedUi(proxy)) {
      mismatch.value = true
      throw new Error('Matching shared UI is required')
    }
    const requested = await sunshine.getCommandLineUrl()
    const path = sharedUiPath(requested)
    // The verified proxy serves the same application used by browsers.
    // No iframe or second navigation tree lives in this bundled loader.
    location.replace(proxy.origin + path)
  } catch {
    failed.value = true
    await invoke('main_panel_ready').catch(() => {})
  }
}
onMounted(connect)
</script>
<style scoped>
.connection-screen { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; padding:24px; color:var(--fd-text-primary); background:var(--fd-bg-primary); }
h1 { font-size:24px; }
button { padding:10px 18px; color:inherit; background:transparent; border:1px solid currentColor; border-radius:6px; cursor:pointer; }
</style>
