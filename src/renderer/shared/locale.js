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
