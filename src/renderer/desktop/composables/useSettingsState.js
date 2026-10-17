import { ref } from 'vue'
import {
  defaultDesktopSettings,
  loadDesktopSettings,
  requestNotificationPermission,
  saveDesktopSettings,
} from './useDesktopSettings'
import { isTauriRuntime } from './useTauri'

export function useSettingsState(t) {
  const invoke = ref(null)
  const hasTauri = ref(false)
  const settings = ref({ ...defaultDesktopSettings })
  const appVersion = ref('0.0.0-dev')
  const statusNotice = ref(null)
  let statusTimer = null

  function showStatus(type, message) {
    clearTimeout(statusTimer)
    statusNotice.value = { type, message }
    statusTimer = setTimeout(() => {
      statusNotice.value = null
    }, 3500)
  }

  async function loadSettings() {
    try {
      settings.value = await loadDesktopSettings()
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  async function resetSettings() {
    settings.value = { ...defaultDesktopSettings }
    try {
      await saveDesktopSettings(settings.value)
      showStatus('info', t.value.settings.resetSuccess)
    } catch (error) {
      console.error('Failed to reset settings:', error)
      showStatus('error', error.message || String(error))
    }
  }

  async function saveSettings() {
    try {
      await saveDesktopSettings(settings.value)
      await requestNotificationPermission(settings.value)
      showStatus('success', t.value.settings.saveSuccess)
    } catch (error) {
      console.error('Failed to save settings:', error)
      showStatus('error', error.message || String(error))
    }
  }

  async function initializeSettingsState() {
    hasTauri.value = await isTauriRuntime()
    if (hasTauri.value) {
      try {
        const tauri = await import('@tauri-apps/api/core')
        invoke.value = tauri.invoke
        const info = await invoke.value('get_system_info').catch(() => null)
        if (info?.app_version) appVersion.value = info.app_version
      } catch (error) {
        console.log('Tauri invoke not available:', error)
      }
    }
    await loadSettings()
  }

  function disposeSettingsState() {
    clearTimeout(statusTimer)
  }

  return {
    appVersion,
    hasTauri,
    settings,
    statusNotice,
    disposeSettingsState,
    initializeSettingsState,
    resetSettings,
    saveSettings,
  }
}
