<template>
  <slot v-if="desktopAvailable || preview" />
  <section v-else class="desktop-required" role="note">
    <p>{{ t.runtime.desktopRequired }}</p>
  </section>
</template>
<script setup>
import { hasDesktopRuntime } from '../shared/runtime.js'
import { isNativeUiPreview } from '../shared/preview.js'
import { useI18n } from '../desktop/i18n/index.js'
const desktopAvailable = hasDesktopRuntime()
const preview = isNativeUiPreview()
const { t } = useI18n()
</script>
<style scoped>
.desktop-required { margin:52px 24px 24px; padding:20px 24px; border:1px solid var(--fd-border); border-radius:8px; color:var(--fd-text-secondary); background:var(--fd-bg-secondary); }
.desktop-required p { margin:0; line-height:1.6; }
</style>
