import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { hasDesktopRuntime } from '../shared/runtime.js'
import { useTheme } from '../desktop/composables/useTheme.js'
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
  const { themeMode, setTheme: setSharedTheme } = useTheme()
  const isDark = computed(() => themeMode.value === 'dark')
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
  const setTheme = (mode) => setSharedTheme(mode)
  watch(themeMode, () => {
    syncTheme()
  }, { immediate: true })

  /**
   * 切换折叠状态
   */
  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
  }

  // 导航方法
  const openVddSettings = () => router.navigate(ROUTES.VDD_SETTINGS)
  const openControllers = () => router.navigate(ROUTES.CONTROLLERS)
  const openDualSense = openControllers
  const openControllersHub = () => router.navigate(ROUTES.CONTROLLERS_HUB)

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
  const initTheme = () => syncTheme()

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

  /**
   * 初始化状态
   */
  const initState = async () => {
    initTheme()
    if (!hasDesktopRuntime()) return
    // 优先初始化偏好设置，确保后端在检查更新前能读取到正确的偏好
    // 然后并行初始化其他状态
    await Promise.all([initAdminStatus(), initWindowState(), initVersion()])

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
    openControllers,
    openDualSense,
    openControllersHub,
  }
}
