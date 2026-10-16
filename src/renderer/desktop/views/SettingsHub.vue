<template>
  <section>
    <h1 class="page-title">{{ t.nav.settings }}</h1>
    <div class="settings-tabs" role="tablist" :aria-label="t.nav.settings">
      <button v-for="item in sections" :key="item.id" :id="`settings-tab-${item.id}`"
        role="tab" :aria-selected="active === item.id" aria-controls="settings-content"
        class="desktop-btn" :class="{ primary: active === item.id }" @click="active = item.id">
        {{ item.label }}
      </button>
    </div>
    <div id="settings-content" role="tabpanel" :aria-labelledby="`settings-tab-${active}`">
      <SettingsView v-if="active === 'desktop'" />
      <StreamView v-else-if="active === 'stream'" />
      <ControllersHub v-else />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../i18n/index.js'
import SettingsView from './SettingsView.vue'
import StreamView from './StreamView.vue'
import ControllersHub from '../../components/controllersHub/ControllersHub.vue'
const { t } = useI18n()
const active = ref('desktop')
const sections = computed(() => [
  { id: 'desktop', label: 'Desktop' },
  { id: 'stream', label: t.value.nav.stream },
  { id: 'controllers', label: t.value.controllers.title },
])
</script>

<style scoped>
.settings-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 28px; }
</style>

