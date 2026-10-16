<template>
  <SettingsCard :title="t.settings.appearance" :icon="Brush">
    <SettingsRow
      :name="t.lite.theme"
      :description="t.lite.themeDescription"
    >
      <select class="form-select" :aria-label="t.lite.theme" :value="themeMode" @change="setTheme($event.target.value)">
        <option value="light">{{ t.lite.light }}</option>
        <option value="dark">{{ t.lite.dark }}</option>
      </select>
    </SettingsRow>
    <SettingsRow :name="t.lite.language">
      <select class="form-select" :aria-label="t.lite.language" v-model="locale">
        <option value="zh_TW">繁體中文</option>
        <option value="en">English</option>
        <option value="zh">简体中文</option>
      </select>
    </SettingsRow>
  </SettingsCard>
</template>

<script setup>
import { Brush } from '@element-plus/icons-vue'
import { useI18n } from '../../i18n/index.js'
import SettingsCard from './SettingsCard.vue'
import SettingsRow from './SettingsRow.vue'
import { useTheme } from '../../composables/useTheme.js'

const { t, locale } = useI18n()
const { themeMode, setTheme } = useTheme()
</script>
