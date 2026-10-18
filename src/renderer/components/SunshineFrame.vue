<template><div ref="host"></div></template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { sunshine } from '../tauri-adapter.js'
import { checkLocalProxyHealth } from '../utils/proxyHealth.js'
import { sharedUiPath } from '../utils/sharedUiTarget.js'
import { mountConnectionScreen, probeConnection } from '../shared/connection-screen.js'
import markup from '../shared/connection-screen.html?raw'
import '../shared/palette.css'
import '../shared/connection-screen.css'

const host = ref(null)
let screen, destination
async function connect(signal) {
  try {
    await invoke('main_panel_loading')
    await invoke('wait_for_proxy_ready')
    const health = await invoke('get_proxy_health_check')
    if (!await checkLocalProxyHealth(health)) throw new Error('Local proxy verification failed')
    const proxy = new URL(await sunshine.getProxyUrl())
    const verified = new URL(health.url)
    if (proxy.origin !== verified.origin) throw new Error('Proxy identity changed')
    await sunshine.refreshTarget()
    signal.throwIfAborted()
    const result = await probeConnection(proxy.origin + '/', { signal })
    if (result === 'ready') {
      const page = await invoke('take_panel_destination')
      const requested = page ? new URL(page, proxy).href : await sunshine.getCommandLineUrl()
      destination = proxy.origin + sharedUiPath(requested)
    } else await invoke('main_panel_ready').catch(() => {})
    return result
  } catch (error) {
    await invoke('main_panel_ready').catch(() => {})
    throw error
  }
}
onMounted(() => {
  // Preserve the existing development-only browser entry without enabling IPC.
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1') {
    location.replace('http://127.0.0.1:8081/')
    return
  }
  host.value.innerHTML = markup
  screen = mountConnectionScreen(host.value, {
    phase: 'preparing', probe: connect,
    onReady: () => location.replace(destination),
  })
  let explicitLocale = false
  try { explicitLocale = Boolean(localStorage.getItem('foundation-interface-locale') || localStorage.getItem('language')) } catch { /* System locale remains available. */ }
  if (!explicitLocale) invoke('get_sunshine_locale').then(value => { if (value) screen?.setLocale(value) }).catch(() => {})
})
onBeforeUnmount(() => screen?.dispose())
</script>
