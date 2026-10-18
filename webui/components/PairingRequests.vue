<template>
  <section class="card my-4" aria-labelledby="pending-pairing-title">
    <div class="card-body p-4">
      <h2 id="pending-pairing-title">{{ copy.pending }}</h2>
      <p v-if="error" class="alert alert-warning" role="alert">{{ copy.unavailable }}
        <button type="button" class="btn btn-outline-secondary ms-2" @click="refresh">{{ copy.retry }}</button>
      </p>
      <p v-else-if="loading" role="status">{{ copy.loading }}</p>
      <p v-else-if="!active" class="text-muted my-3">{{ copy.empty }}</p>
      <div v-if="message" :class="['alert', succeeded ? 'alert-success' : 'alert-warning']" role="status">{{ message }}</div>
      <template v-if="active && !error">
        <div class="request-list" role="list">
          <div v-for="request in requests" :key="request.id" class="request-item" role="listitem">
            <strong>{{ request.name }}</strong>
            <span>{{ copy.source }}: {{ request.address }}</span>
            <span>{{ copy.received }}: {{ new Date(request.received_at).toLocaleTimeString() }}</span>
            <span>{{ remaining }} {{ copy.seconds }}</span>
          </div>
        </div>
        <form class="pairing-form" @submit.prevent="submit">
          <label for="pin-input">{{ $t('navbar.pin') }}</label>
          <input id="pin-input" ref="pinInput" v-model="pin" class="form-control" inputmode="numeric"
            autocomplete="off" pattern="[0-9]{4}" maxlength="4" required :disabled="sending || !remaining" />
          <label for="name-input">{{ $t('pin.device_name') }}</label>
          <input id="name-input" v-model="name" class="form-control" maxlength="256" required :disabled="sending" />
          <p class="alert alert-warning">{{ $t('pin.warning_msg') }}</p>
          <button class="btn btn-primary" type="submit" :disabled="sending || !remaining">{{ shellT.pairingCopy.verify }}</button>
        </form>
      </template>
    </div>
  </section>
</template>
<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { apiJson, apiPostJson } from '../utils/apiFetch.js'
import { useNavigationCopy } from '@/shared/navigationCopy.js'
import { useI18n } from '@/desktop/i18n/index.js'
const emit = defineEmits(['paired'])
const copy = useNavigationCopy(), { t: shellT } = useI18n()
const requests = ref([]), pin = ref(''), name = ref(''), pinInput = ref(null)
const loading = ref(true), error = ref(false), sending = ref(false), message = ref(''), succeeded = ref(false)
const now = ref(Date.now())
const active = computed(() => requests.value[0])
const remaining = computed(() => Math.max(0, Math.ceil(((active.value?.deadline || 0) - now.value) / 1000)))
let timer, stopped = false, refreshing = false
async function refresh() {
  if (refreshing || sending.value || stopped) return
  refreshing = true
  try {
    const data = await apiJson('/api/pairing/requests')
    if (!Array.isArray(data.requests)) throw new Error('Invalid pairing response')
    if (stopped) return
    const previous = active.value?.id
    const received = Date.now()
    requests.value = data.requests.slice(0, 1).map(request => ({ ...request, deadline: received + request.remaining_seconds * 1000 }))
    now.value = received
    error.value = false
    if (active.value?.id !== previous) {
      pin.value = ''
      name.value = active.value?.name || ''
      if (previous && !succeeded.value) message.value = copy.value.expired
      if (active.value) { await nextTick(); pinInput.value?.focus() }
    }
  } catch { if (!stopped) error.value = true }
  finally { loading.value = false; refreshing = false }
}
async function submit() {
  if (!active.value || !remaining.value || error.value || sending.value) return
  const requestId = active.value.id
  sending.value = true; message.value = ''; succeeded.value = false
  try {
    const result = await apiPostJson('/api/pin', { request_id: requestId, pin: pin.value, name: name.value })
    succeeded.value = String(result.status).toLowerCase() === 'true'
    message.value = succeeded.value ? copy.value.success : copy.value.failed
    pin.value = ''
    if (succeeded.value) emit('paired')
  } catch { message.value = copy.value.unavailable }
  finally { sending.value = false; await refresh() }
}
onMounted(() => {
  refresh()
  timer = setInterval(() => {
    now.value = Date.now()
    if (active.value && !remaining.value) {
      requests.value = []; pin.value = ''; message.value = copy.value.expired
    }
    refresh()
  }, 1000)
})
onUnmounted(() => { stopped = true; clearInterval(timer) })
</script>
<style scoped>
h2 { font-size:18px; font-weight:600; margin-bottom:1rem; }
.request-list { margin:1rem 0; }
.request-item { display:flex; flex-wrap:wrap; gap:0.5rem 1.5rem; padding:1rem; border:1px solid var(--ui-border-strong); border-radius:var(--ui-radius-md); background:var(--ui-accent-soft); }
.request-item strong { flex-basis:100%; }
.request-item span { font-size:13px; color:var(--ui-text-secondary); }
.pairing-form { max-width:460px; display:grid; gap:0.75rem; }
.pairing-form .alert { margin:0.5rem 0; }
</style>
