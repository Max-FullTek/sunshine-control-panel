<template>
  <section class="chub-panel"><div class="chub-section"><div class="chub-cards">
    <article class="chub-card">
      <div class="chub-card-head"><strong>{{ t.controllersHub.peripherals.stylus.title }}</strong></div>
      <p class="chub-hint">{{ t.controllersHub.peripherals.stylus.hint }}</p>
      <div class="chub-card-actions"><el-button size="small" type="primary" @click="emit('open-stylus-input-probe')">{{ t.controllersHub.peripherals.stylus.launch }}</el-button></div>
    </article>
  </div></div></section>
</template>
<script setup>
import { useI18n } from '../../desktop/i18n/index.js'
const emit = defineEmits(['open-stylus-input-probe'])
const { t } = useI18n()
</script>
