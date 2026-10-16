<template>
  <section class="dashboard-view">
    <h1 class="page-title">{{ t.lite.overview }}</h1>
    <div class="overview-status" role="status">
      <span class="status-dot" :class="{ online }"></span>
      <strong>Sunshine · {{ online ? t.dashboard.status.online : t.dashboard.status.offline }}</strong>
      <span>{{ systemInfo.sunshineVersion }}</span>
    </div>
    <dl class="overview-metrics">
      <div><dt>{{ t.dashboard.pairedDevices }}</dt><dd>{{ pairedDevices }}</dd></div>
      <div><dt>{{ t.dashboard.activeSessions }}</dt><dd>{{ activeSessions }}</dd></div>
      <div><dt>{{ t.dashboard.uptime }}</dt><dd>{{ uptime }}</dd></div>
    </dl>
    <section class="overview-section">
      <h2>{{ t.dashboard.quickActions }}</h2>
      <div class="overview-actions">
        <button class="desktop-btn" @click="emit('navigate', 'devices')">{{ t.sidebar.clientPairing }}</button>
        <button class="desktop-btn" @click="emit('navigate', 'apps')">{{ t.nav.apps }}</button>
        <button class="desktop-btn" :disabled="!native" @click="openLogs">{{ t.dashboard.viewLogs }}</button>
      </div>
      <p v-if="notice" role="alert">{{ notice }}</p>
    </section>
    <section class="overview-section">
      <h2>{{ t.dashboard.systemInfo }}</h2>
      <dl class="overview-system">
        <dt>{{ t.dashboard.gpu }}</dt><dd>{{ systemInfo.gpu }}</dd>
        <dt>{{ t.dashboard.os }}</dt><dd>Windows</dd>
      </dl>
    </section>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../i18n/index.js'
import { isTauriRuntime, tauriInvoke } from '../composables/useTauri.js'
const { t } = useI18n()
const emit = defineEmits(['navigate'])
const native = ref(false)
const online = ref(false)
const pairedDevices = ref('—')
const activeSessions = ref('—')
const startTime = ref(0)
const now = ref(Date.now())
const notice = ref('')
const systemInfo = ref({ sunshineVersion: '—', gpu: '—' })
const uptime = computed(() => {
  if (!startTime.value) return '—'
  const total = Math.max(0, Math.floor((now.value - startTime.value) / 1000))
  return [Math.floor(total / 3600), Math.floor(total % 3600 / 60), total % 60].map(v => String(v).padStart(2, '0')).join(':')
})
let clock = null
let poll = null
let disposed = false
let refreshing = false
async function refresh() {
  if (!native.value || refreshing || disposed) return
  refreshing = true
  try {
    const sessions = await tauriInvoke('get_active_sessions')
    if (disposed) return
    activeSessions.value = sessions?.length ?? 0
    online.value = true
    const proxy = await tauriInvoke('get_proxy_url_command')
    const response = await fetch(`${proxy}/api/clients/list`, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error('Host unavailable')
    const data = await response.json()
    if (!disposed && data.status?.toString() === 'true') pairedDevices.value = data.named_certs?.length ?? 0
  } catch {
    if (!disposed) online.value = false
  } finally { refreshing = false }
}
async function openLogs() {
  try { await tauriInvoke('open_tool_window', { toolName: 'logs' }) }
  catch { notice.value = t.value.toolActions.windowOpenFailed.replace('{title}', t.value.dashboard.viewLogs) }
}
onMounted(async () => {
  native.value = await isTauriRuntime()
  if (!native.value || disposed) return
  const results = await Promise.allSettled([
    tauriInvoke('get_sunshine_version'), tauriInvoke('get_gpus'), tauriInvoke('get_sunshine_start_time'),
  ])
  if (disposed) return
  if (results[0].status === 'fulfilled') systemInfo.value.sunshineVersion = results[0].value || '—'
  if (results[1].status === 'fulfilled') systemInfo.value.gpu = results[1].value?.join(', ') || '—'
  if (results[2].status === 'fulfilled') startTime.value = results[2].value?.start_time_ms || 0
  await refresh()
  if (disposed) return
  clock = setInterval(() => { now.value = Date.now() }, 1000)
  poll = setInterval(refresh, 10000)
})
onUnmounted(() => { disposed = true; clearInterval(clock); clearInterval(poll) })
</script>

<style scoped>
.dashboard-view { max-width: 1050px; }
.overview-status { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 18px 0; }
.overview-status > span:last-child { color: var(--fd-text-secondary); font-size: 13px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--fd-status-danger); }
.status-dot.online { background: var(--fd-status-success); }
.overview-metrics { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); margin: 16px 0 32px; padding: 24px 0; border-top: 1px solid var(--fd-border); border-bottom: 1px solid var(--fd-border); gap: 24px; }
dt { color: var(--fd-text-secondary); font-size: 14px; }
dd { margin: 10px 0 0; font-size: 24px; font-weight: 600; }
.overview-section { margin: 28px 0; }
h2 { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
.overview-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.overview-system { display: grid; grid-template-columns: 100px minmax(0,1fr); gap: 16px; }
.overview-system dd { margin: 0; font-size: 14px; font-weight: 400; overflow-wrap: anywhere; }
@media(max-width:600px) { .overview-metrics { gap: 12px; } dd { font-size: 20px; } }
</style>
