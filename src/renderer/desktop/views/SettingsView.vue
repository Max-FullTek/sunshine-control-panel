<template>
  <div class="settings-view">

    <SettingsToggleSection
      :title="t.settings.startup"
      :icon="Promotion"
      :items="startupSettings"
      :values="settings"
      @update-value="setSettingValue"
    />

    <SettingsToggleSection
      :title="t.settings.notifications"
      :icon="Bell"
      :items="notificationSettings"
      :values="settings"
      @update-value="setSettingValue"
    />

    <SettingsAdvancedCard
      :values="settings"
      @update-value="setSettingValue"
    />

    <SettingsNotice :notice="statusNotice" />

    <SettingsActions @reset="resetSettings" @save="saveSettings" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { Bell, Promotion } from '@element-plus/icons-vue'
import { useSettingsState } from '../composables/useSettingsState'
import { useI18n } from '../i18n/index.js'
import SettingsActions from '../components/settings/SettingsActions.vue'
import SettingsAdvancedCard from '../components/settings/SettingsAdvancedCard.vue'
import SettingsNotice from '../components/settings/SettingsNotice.vue'
import SettingsToggleSection from '../components/settings/SettingsToggleSection.vue'

const { t } = useI18n()

const {
  settings,
  statusNotice,
  disposeSettingsState,
  initializeSettingsState,
  resetSettings,
  saveSettings,
} = useSettingsState(t)

const startupSettings = computed(() => [
  {
    key: 'autoStart',
    name: t.value.settings.autoStart,
    description: t.value.settings.autoStartDesc,
  },
  {
    key: 'startMinimized',
    name: t.value.settings.startMinimized,
    description: t.value.settings.startMinimizedDesc,
  },
  {
    key: 'autoStartSunshine',
    name: t.value.settings.autoStartSunshine,
    description: t.value.settings.autoStartSunshineDesc,
  },
])

const notificationSettings = computed(() => [  {
    key: 'notifications',
    name: t.value.settings.desktopNotifications,
    description: t.value.settings.desktopNotificationsDesc,
  },
  {
    key: 'connectionNotify',
    name: t.value.settings.connectionNotify,
    description: t.value.settings.connectionNotifyDesc,
    disabled: !settings.value.notifications,
  },
])

function setSettingValue(key, value) {
  settings.value = {
    ...settings.value,
    [key]: value,
  }
}

onMounted(async () => {
  await initializeSettingsState()
})

onUnmounted(() => {
  disposeSettingsState()
})
</script>

<style lang="less" scoped>
.settings-view {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;

  .page-title {
    font-size: 36px;
    font-weight: 700;
    color: var(--fd-text-primary, #fff);
    margin: 0 0 10px 0;
  }

  .page-subtitle {
    font-size: 18px;
    color: rgba(var(--fd-text-primary-rgb, 255, 255, 255), 0.5);
    margin: 0;
  }
}

</style>

