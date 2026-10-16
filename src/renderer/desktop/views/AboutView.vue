<template>
  <section class="about-view">
    <h1 class="page-title">{{ t.lite.about }}</h1>
    <p class="about-summary">Foundation Desktop · {{ version }}</p>
    <p>{{ t.lite.referenceDescription }}</p>
    <ul class="reference-list">
      <li v-for="link in referenceLinks" :key="link.url">
        <a :href="link.url" target="_blank" rel="noopener noreferrer" @click.prevent="openReference(link.url)">{{ link.name }}</a>
      </li>
    </ul>
    <p class="license-note">{{ t.lite.licenseNotice }}</p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../i18n/index.js'
import { isTauriRuntime, tauriInvoke } from '../composables/useTauri.js'
import { referenceLinks } from '../../shared/referenceLinks.js'
const { t } = useI18n()
const version = ref('—')
onMounted(async () => {
  if (await isTauriRuntime()) {
    const { getVersion } = await import('@tauri-apps/api/app')
    version.value = await getVersion()
  }
})
async function openReference(url) {
  if (await isTauriRuntime()) await tauriInvoke('open_external_url', { url })
  else window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.about-view { max-width: 850px; }
.about-summary { font-size: 18px; margin: 20px 0; }
.reference-list { padding: 0; list-style: none; margin: 24px 0; }
.reference-list li { padding: 14px 0; border-bottom: 1px solid var(--fd-border); }
a { color: var(--fd-accent); }
.license-note { color: var(--fd-text-secondary); line-height: 1.7; }
</style>
