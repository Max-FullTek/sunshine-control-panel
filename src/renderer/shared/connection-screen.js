// Also embedded inline in the proxy's unavailable response: keep this module
// dependency-free so recovery does not depend on an available backend or assets.
export const connectionMessages = {
  zh_TW: {
    preparing: '正在準備控制面板', waiting: '正在連接 Sunshine', offline: '尚未連上 Sunshine', ready: '已找到 Sunshine', mismatch: '需要相容的 Sunshine 版本',
    preparingDescription: '正在準備本機連線，請稍候。', waitingDescription: '控制介面準備中，連線成功後會自動開啟。', offlineDescription: '仍會自動重試。請確認 Sunshine 是否正在執行。', readyDescription: '連線成功，即將開啟控制介面。', mismatchDescription: '控制面板與 Sunshine 版本不相容，請更新為相容的版本。',
    searching: '正在搜尋 Sunshine…', readyStatus: 'Sunshine 已就緒', mismatchStatus: '版本檢查未通過', retry: '重新偵測', help: '連線說明',
    helpText: '首次啟動或套用設定後，Sunshine 可能需要一點時間。若持續無法連線，請確認 Sunshine 是否正在執行。',
  },
  zh: {
    preparing: '正在准备控制面板', waiting: '正在连接 Sunshine', offline: '尚未连接 Sunshine', ready: '已找到 Sunshine', mismatch: '需要兼容的 Sunshine 版本',
    preparingDescription: '正在准备本机连接，请稍候。', waitingDescription: '控制界面准备中，连接成功后会自动打开。', offlineDescription: '仍会自动重试。请确认 Sunshine 是否正在运行。', readyDescription: '连接成功，即将打开控制界面。', mismatchDescription: '控制面板与 Sunshine 版本不兼容，请更新为兼容的版本。',
    searching: '正在搜索 Sunshine…', readyStatus: 'Sunshine 已就绪', mismatchStatus: '版本检查未通过', retry: '重新检测', help: '连接说明',
    helpText: '首次启动或应用设置后，Sunshine 可能需要一点时间。如果持续无法连接，请确认 Sunshine 是否正在运行。',
  },
  en: {
    preparing: 'Preparing the control panel', waiting: 'Connecting to Sunshine', offline: 'Sunshine is not connected yet', ready: 'Sunshine found', mismatch: 'A compatible Sunshine version is required',
    preparingDescription: 'Preparing the local connection. Please wait.', waitingDescription: 'The control interface will open automatically when ready.', offlineDescription: 'Retrying automatically. Check that Sunshine is running.', readyDescription: 'Connected. Opening the control interface…', mismatchDescription: 'The control panel and Sunshine versions are incompatible. Update to compatible versions.',
    searching: 'Searching for Sunshine…', readyStatus: 'Sunshine is ready', mismatchStatus: 'Version check failed', retry: 'Check again', help: 'Connection help',
    helpText: 'Sunshine may take a moment after first launch or a settings change. If it stays disconnected, check that Sunshine is running.',
  },
}

export function connectionLocale(value) {
  const locale = String(value || '').replaceAll('_', '-').toLowerCase()
  return /^zh-(tw|hk|mo|hant)(-|$)/.test(locale) ? 'zh_TW' : /^zh($|-)/.test(locale) ? 'zh' : 'en'
}

export function initialConnectionLocale(storage = globalThis.localStorage, language = globalThis.navigator?.language) {
  try {
    return connectionLocale(storage.getItem('foundation-interface-locale') || storage.getItem('language') || storage.getItem('sunshine-locale') || language)
  } catch { return connectionLocale(language) }
}

export async function probeConnection(url, { signal, request = globalThis.fetch } = {}) {
  const response = await request(url, { cache: 'no-store', signal })
  // A restart/unavailable response is never evidence of a version mismatch.
  if (!response.ok) return 'waiting'
  return /<meta\s+name="foundation-shared-ui"\s+content="1"\s*\/?\s*>/.test(await response.text()) ? 'ready' : 'mismatch'
}

export function retryDelay(attempt) {
  return attempt < 10 ? 1000 : attempt < 14 ? 5000 : 30000
}

export function mountConnectionScreen(host, options = {}) {
  const root = host.querySelector('.foundation-connection')
  const radar = root.querySelector('.ss-radar')
  const sweep = root.querySelector('.ss-sweep')
  const targets = [...root.querySelectorAll('.ss-target:not(.ss-sunshine)')]
  const sunshine = root.querySelector('.ss-sunshine')
  const name = root.querySelector('.ss-name')
  const ray = root.querySelector('.ss-ray')
  const retry = root.querySelector('[data-retry]')
  let locale = options.locale || initialConnectionLocale()
  let phase = options.phase || 'waiting'
  let attempt = 0, timer, navigationTimer, controller, generation = 0, disposed = false
  let angle = 0, previousTime = 0, frameId
  const pingUntil = [0, 0, 0, 0]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const media = matchMedia('(prefers-color-scheme: dark)')
  function applyTheme() {
    let theme = options.theme
    try {
      const desktop = JSON.parse(localStorage.getItem('foundation-desktop-theme') || 'null')
      theme ||= desktop?.mode || desktop?.preset || localStorage.getItem('theme')
    } catch { /* Use system appearance. */ }
    root.dataset.bsTheme = theme === 'light' || theme === 'dark' ? theme : media.matches ? 'dark' : 'light'
    root.style.colorScheme = root.dataset.bsTheme
  }
  function render() {
    const text = connectionMessages[connectionLocale(locale)]
    root.lang = connectionLocale(locale) === 'zh_TW' ? 'zh-Hant-TW' : connectionLocale(locale) === 'zh' ? 'zh-Hans' : 'en'
    root.dataset.found = String(phase === 'ready')
    root.querySelector('[data-title]').textContent = text[phase]
    root.querySelector('[data-description]').textContent = text[phase + 'Description']
    root.querySelector('[data-status]').textContent = phase === 'ready' ? text.readyStatus : phase === 'mismatch' ? text.mismatchStatus : text.searching
    root.querySelector('summary').textContent = text.help
    root.querySelector('details p').textContent = text.helpText
    retry.textContent = text.retry
    retry.hidden = phase === 'ready'
    radar.setAttribute('aria-label', phase === 'ready' ? text.readyStatus : text.searching)
  }
  function setState(value) {
    phase = value; render()
    if (phase === 'ready' || phase === 'mismatch') cancelAnimationFrame(frameId)
    else if (!disposed) animate()
  }
  const slot = Math.floor(Math.random() * 4)
  const [x, y] = [[76, 28], [22, 30], [77, 70], [29, 73]][slot]
  for (const element of [sunshine, name]) {
    element.style.setProperty('--x', x + '%'); element.style.setProperty('--y', y + '%')
  }
  radar.style.setProperty('--ss-target-x', x + '%'); radar.style.setProperty('--ss-target-y', y + '%')
  const dx = (x - 50) * 2.44, dy = (y - 50) * 2.44
  ray.style.setProperty('--ss-distance', Math.max(0, Math.hypot(dx, dy) - 34) + 'px')
  ray.style.setProperty('--ss-direction', Math.atan2(dy, dx) * 180 / Math.PI + 'deg')
  function frame(time) {
    if (disposed) return
    const delta = previousTime ? Math.min(time - previousTime, 100) / 1000 : 0
    previousTime = time
    if (phase !== 'ready' && phase !== 'mismatch' && !reduced.matches) {
      angle = (angle + delta * 72) % 360
      sweep.style.setProperty('--ss-angle', angle + 'deg')
      targets.forEach((element, index) => {
        if ((angle - Number(element.dataset.angle) + 360) % 360 < 7) pingUntil[index] = time + 1600
        element.classList.toggle('ss-ping', time < pingUntil[index])
      })
    }
    if (phase !== 'ready' && phase !== 'mismatch' && !reduced.matches) frameId = requestAnimationFrame(frame)
  }
  function animate() { cancelAnimationFrame(frameId); previousTime = 0; frameId = requestAnimationFrame(frame) }
  async function check(reset = false) {
    if (disposed) return
    if (reset) { attempt = 0; clearTimeout(timer); clearTimeout(navigationTimer); controller?.abort(); setState('waiting'); animate() }
    const current = ++generation
    controller = new AbortController()
    const activeController = controller
    const timeout = setTimeout(() => activeController.abort(), 6000)
    let result = 'waiting'
    try { result = await (options.probe || (signal => probeConnection(location.href, { signal })))(activeController.signal) } catch { /* Retain automatic recovery. */ }
    clearTimeout(timeout)
    if (disposed || current !== generation) return
    if (result === 'ready' || result === 'mismatch') {
      setState(result)
      cancelAnimationFrame(frameId)
      if (result === 'ready') navigationTimer = setTimeout(() => {
        if (!disposed) (options.onReady || (() => location.reload()))()
      }, 650)
      return
    }
    setState(attempt >= 10 ? 'offline' : 'waiting')
    timer = setTimeout(() => check(), retryDelay(attempt++))
  }
  const onRetry = () => check(true)
  const onStorage = () => { locale = options.locale || initialConnectionLocale(); applyTheme(); render() }
  retry.addEventListener('click', onRetry)
  media.addEventListener('change', applyTheme)
  window.addEventListener('storage', onStorage)
  applyTheme(); render(); animate()
  if (options.autoStart !== false) check()
  return {
    setState,
    setLocale(value) { locale = value; render() },
    setTheme(value) { options.theme = value; applyTheme() },
    retry: onRetry,
    dispose() {
      disposed = true; generation++; controller?.abort(); clearTimeout(timer); clearTimeout(navigationTimer); cancelAnimationFrame(frameId)
      retry.removeEventListener('click', onRetry); media.removeEventListener('change', applyTheme); window.removeEventListener('storage', onStorage)
    },
  }
}

if (typeof document !== 'undefined') {
  const host = document.querySelector('[data-connection-autostart]')
  if (host) {
    const screen = mountConnectionScreen(host)
    window.addEventListener('pagehide', () => screen.dispose(), { once: true })
  }
}
