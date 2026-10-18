<template>
  <ConfirmDialog :show="open" dialog-id="setup-wizard-dialog" :title="copy.setup" max-width="960px"
    :close-label="$t('_common.close')" :dismissible="!wizard?.saving && !wizard?.showRestartModal"
    @close="close">
    <p v-if="loading" role="status">{{ copy.loading }}</p>
    <div v-else-if="error" class="alert alert-danger" role="alert">{{ copy.error }}
      <button type="button" class="btn btn-outline-secondary ms-2" @click="show">{{ copy.retry }}</button>
    </div>
    <SetupWizard v-else-if="config" ref="wizard" :initial-config="config" :adapters="config.adapters || []"
      :display-devices="config.display_devices || []" :has-locale="hasLocale"
      @setup-complete="complete" />
  </ConfirmDialog>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ConfirmDialog from './common/ConfirmDialog.vue'
import SetupWizard from './SetupWizard.vue'
import { apiJson } from '../utils/apiFetch.js'
import { useNavigationCopy } from '@/shared/navigationCopy.js'
import { useSetupWizard } from '../composables/useSetupWizard.js'
const copy = useNavigationCopy()
const { checkSetupWizard, hasLocale, onSetupComplete } = useSetupWizard()
const open = ref(false), loading = ref(false), error = ref(false), config = ref(null), wizard = ref(null)
let stopped = false
async function show() {
  if (loading.value) return
  open.value = true
  loading.value = true
  config.value = null
  error.value = false
  try {
    const result = await apiJson('/api/config')
    if (!stopped && open.value) { checkSetupWizard(result, { force: true }); config.value = result }
  } catch { error.value = true }
  finally { loading.value = false }
}
function close() {
  open.value = false
  config.value = null
  if (location.hash === '#setup') history.replaceState(null, '', location.pathname + location.search)
  if (new URLSearchParams(location.search).has('setup')) {
    const url = new URL(location.href); url.searchParams.delete('setup'); history.replaceState(null, '', url)
  }
}
function complete() { onSetupComplete(); close(); location.reload() }
onMounted(() => {
  window.addEventListener('open-setup-wizard', show)
  if (location.hash === '#setup' || new URLSearchParams(location.search).get('setup') === '1') show()
})
onUnmounted(() => { stopped = true; window.removeEventListener('open-setup-wizard', show) })
</script>
