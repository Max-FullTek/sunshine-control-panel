import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, ROUTES } from './useRouter.js'
import { useI18n } from '../desktop/i18n/index.js'

const STORAGE_KEYS = {
  THEME: 'sunshine-theme',
}

const THEME = {
  DARK: 'dark',
  LIGHT: 'light',
}

/**
 * 规范化版本号（移除 v/V 前缀）
 */

/**
 * 向 iframe 发送消息
 */
const postMessageToIframes = (message) => {
  document.querySelectorAll('iframe').forEach((iframe) => {
    try {
      iframe.contentWindow?.postMessage(message, '*')
    } catch {
      // 跨域限制，忽略错误
    }
  })
}

/**
 * 获取 Tauri invoke 函数
 */
const getInvoke = async () => {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke
}

/**
 * 安全地从 localStorage 读取布尔值
 */
/**
 * 侧边栏状态管理 Composable
 */
export function useSidebarState() {
  const router = useRouter()
  const { t } = useI18n()

  // 状态定义
  const isCollapsed = ref(false)
  const isDark = ref(true)
  const themeMode = ref('system')
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
  const isMaximized = ref(false)
  const isAdmin = ref(true)
  const currentVersion = ref('0.0.0')

  // 清理函数存储
  const cleanupFns = []

  // 计算属性
  const currentTheme = computed(() => (isDark.value ? THEME.DARK : THEME.LIGHT))

  /**
   * 同步主题到 DOM 和 localStorage
   */
  const syncTheme = () => {
    document.documentElement?.setAttribute('data-bs-theme', currentTheme.value)
    localStorage.setItem(STORAGE_KEYS.THEME, themeMode.value)
    document.documentElement.style.colorScheme = currentTheme.value
  }

  /**
   * 切换主题
   */
  const setTheme = (mode) => {
    if (!['light', 'dark', 'system'].includes(mode)) return
    themeMode.value = mode
    isDark.value = mode === 'system' ? systemTheme.matches : mode === THEME.DARK
    syncTheme()
    postMessageToIframes({ type: 'theme-sync', theme: currentTheme.value })
  }

  /**
   * 切换折叠状态
   */
  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
  }

  // 导航方法
  const openVddSettings = () => router.navigate(ROUTES.VDD_SETTINGS)
  const openWelcome = () => router.navigate(ROUTES.WELCOME)
  const openControllers = () => router.navigate(ROUTES.CONTROLLERS)
  const openDualSense = openControllers
  const openControllersHub = () => router.navigate(ROUTES.CONTROLLERS_HUB)
  // RTX HDR 的定向入口也进入公共 HDR 管理页；具体实现由页面内的组件卡片负责。
  const openRtxHdr = () => router.navigate(ROUTES.HDR_ENHANCED)

  /**
   * 初始化管理员状态
   */
  const initAdminStatus = async () => {
    try {
      const invoke = await getInvoke()
      isAdmin.value = await invoke('is_running_as_admin')
      console.log(isAdmin.value ? '✅ 当前以管理员权限运行' : '⚠️ 当前未以管理员权限运行')
    } catch (error) {
      console.error('检测管理员权限失败:', error)
    }
  }

  /**
   * 初始化主题
   */
  const initTheme = () => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
    setTheme(['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system')
    const handleSystemTheme = () => {
      if (themeMode.value === 'system') setTheme('system')
    }
    systemTheme.addEventListener('change', handleSystemTheme)
    cleanupFns.push(() => systemTheme.removeEventListener('change', handleSystemTheme))
  }

  /**
   * 初始化窗口状态
   */
  const initWindowState = async () => {
    try {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      isMaximized.value = await getCurrentWebviewWindow().isMaximized()
    } catch (error) {
      console.error('检测窗口状态失败:', error)
    }
  }

  /**
   * 初始化版本信息
   */
  const initVersion = async () => {
    try {
      const invoke = await getInvoke()
      currentVersion.value = (await invoke('get_sunshine_version')) || 'Unknown'
    } catch (error) {
      console.error('获取 Sunshine 版本失败:', error)
      currentVersion.value = 'Unknown'
    }
  }

  /**
   * 初始化事件监听
   */
  const initEventListeners = async () => {
    // iframe 主题请求监听
    const handleMessage = ({ origin, data }) => {
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
      if (isLocalhost && data.type === 'request-theme') {
        postMessageToIframes({ type: 'theme-sync', theme: currentTheme.value })
      }
    }
    window.addEventListener('message', handleMessage)
    cleanupFns.push(() => window.removeEventListener('message', handleMessage))

  }

  /**
   * 初始化状态
   */
  const initState = async () => {
    initTheme()
    // 优先初始化偏好设置，确保后端在检查更新前能读取到正确的偏好
    // 然后并行初始化其他状态
    await Promise.all([initAdminStatus(), initWindowState(), initVersion(), initEventListeners()])

  }

  onMounted(initState)

  onUnmounted(() => {
    cleanupFns.forEach((fn) => fn?.())
    cleanupFns.length = 0
  })

  return {
    // 状态
    isCollapsed,
    themeMode,
    isMaximized,
    isAdmin,
    currentVersion,
    router,

    // 方法
    setTheme,
    toggleCollapse,
    openVddSettings,
    openWelcome,
    openControllers,
    openDualSense,
    openControllersHub,
    openRtxHdr,
  }
}
