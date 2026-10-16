export function normalizeLocale(value) {
  const locale = String(value || '').trim().replaceAll('_', '-').toLowerCase()
  if (/^zh-(tw|hk|mo|hant)(-|$)/.test(locale)) return 'zh_TW'
  if (locale === 'zh' || locale.startsWith('zh-')) return 'zh'
  return 'en'
}

export function documentLocale(value) {
  const locale = normalizeLocale(value)
  return locale === 'zh_TW' ? 'zh-Hant-TW' : locale === 'zh' ? 'zh-Hans' : 'en'
}

// Explicit interface choice wins over the host default on every page load.
export function readInterfaceLocale(storage) {
  try {
    const value = storage.getItem('foundation-interface-locale')
    return ['zh_TW', 'zh', 'en'].includes(value) ? value : null
  } catch { return null }
}
export function writeInterfaceLocale(storage, value) {
  try { storage.setItem('foundation-interface-locale', normalizeLocale(value)) } catch { /* In-memory switching still works. */ }
}
