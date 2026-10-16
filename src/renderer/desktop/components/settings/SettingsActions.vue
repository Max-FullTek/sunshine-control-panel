<template>
  <div class="actions-bar fade-in">
    <PageAction :label="t.settings.resetDefaults" @click="emit('reset')" />
    <PageAction primary icon="save" :label="t.settings.saveSettings" @click="emit('save')" />
  </div>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js'
import PageAction from '../../../components/PageAction.vue'

const emit = defineEmits(['reset', 'save'])
const { t } = useI18n()
</script>

<style lang="less" scoped>
.actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(var(--fd-accent-rgb, 0, 255, 245), 0.1);
}
</style>
