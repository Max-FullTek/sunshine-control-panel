import { ref, watch } from 'vue'
import { normalizeTheme, themePresets } from './themePresets.js'

const STORAGE_KEY = 'foundation-desktop-theme'
function loadTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return normalizeTheme(saved?.mode || saved?.preset)
  } catch {
    return 'dark'
  }
}

const themeMode = ref(loadTheme())
function applyTheme(mode) {
  const root = document.documentElement
  root.dataset.fdTheme = mode
  root.dataset.bsTheme = mode
  root.style.setProperty('--fd-border', 'rgba(var(--fd-text-primary-rgb), .16)')
  root.style.colorScheme = mode
  for (const [name, value] of Object.entries(themePresets[mode])) {
    root.style.setProperty(name, value)
  }
}

watch(themeMode, (mode) => {
  applyTheme(mode)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode }))
  } catch { /* Theme still works when storage is unavailable. */ }
}, { immediate: true })

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) themeMode.value = loadTheme()
})

export function useTheme() {
  return { themeMode, setTheme: (mode) => { themeMode.value = normalizeTheme(mode) } }
}
