import { ref } from 'vue'
import { ElMessage, ElMessageBox, ElLoading, ElNotification } from 'element-plus'
import { openExternalUrl, tools } from '@/tauri-adapter.js'
import { useI18n } from '../desktop/i18n/index.js'
import { formatMessage } from '../shared/format-message.js'

// Module-scoped reactive flag so all sidebar instances share state.
const clipboardSyncEnabled = ref(false)
let clipboardSyncInitialised = false
let clipboardSyncPollTimer = null

/**
 * 工具操作 Composable
 */
export function useTools() {
  const { t } = useI18n()

  /**
   * 打开串流计时器
   */
  const openTimer = async () => {
    await createWindow('/stop-clock-canvas/index.html', t.value.sidebar.streamTimer, {
      prefix: 'timer',
      width: 1080,
      height: 600,
    })
  }

  /**
   * 按需加载并打开随 GUI 安装的手写笔输入检测插件。
   * 后端只返回稳定错误码，避免在界面中暴露本地安装路径。
   */
  const openStylusInputProbe = async () => {
    try {
      await tools.openNativeTool('alkaidlab.stylus')
      ElMessage.success(t.value.tools.stylusInputProbeStarted)
    } catch (error) {
      const errorCode = String(error || '')
      const missing = errorCode.includes('NATIVE_PLUGIN_NOT_FOUND')
      const cleanupPending = errorCode.includes('NATIVE_PLUGIN_CLEANUP_PENDING')
      const incompatible = [
        'NATIVE_PLUGIN_PATH_INVALID',
        'NATIVE_PLUGIN_LOAD_FAILED',
        'NATIVE_PLUGIN_ENTRY_MISSING',
        'NATIVE_PLUGIN_ABI_MISMATCH',
        'NATIVE_PLUGIN_ID_MISMATCH',
        'NATIVE_PLUGIN_INIT_FAILED',
      ].some((code) => errorCode.includes(code))
      console.error('[StylusInputProbe] launch failed:', errorCode)
      try {
        await ElMessageBox.alert(
          missing
            ? t.value.tools.stylusInputProbeMissing
            : cleanupPending
              ? t.value.tools.stylusInputProbeCleanupPending
              : incompatible
                ? t.value.tools.stylusInputProbeUntrusted
                : t.value.tools.stylusInputProbeLaunchFailed,
          t.value.tools.stylusInputProbeErrorTitle,
          {
            confirmButtonText: t.value.systemTools.confirm,
            type: 'error',
            showClose: false,
            closeOnClickModal: false,
            closeOnPressEscape: false,
          },
        )
      } catch {
        // The launch failure has already been handled and must not escape the UI action.
      }
    }
  }

  /**
   * 打开外部 URL
   * @param {string} url - 要打开的URL
   */
  const openUrl = async (url) => {
    await openExternalUrl(url)
  }

  /**
   * 清理无用的封面图片和临时文件
   */
  const cleanupCovers = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')

      // 首先检查是否以管理员权限运行
      const isRunningAsAdmin = await invoke('is_running_as_admin')

      if (!isRunningAsAdmin) {
        // 不是管理员，提示重启
        await ElMessageBox.confirm(t.value.toolActions.cleanupAdminRequired, t.value.toolActions.adminRequiredTitle, {
          confirmButtonText: t.value.toolActions.restartAsAdmin,
          cancelButtonText: t.value.common.cancel,
          type: 'warning',
        })

        // 用户确认后，调用重启为管理员
        await restartAsAdmin()
        return
      }

      // 已经是管理员，继续执行清理
      await ElMessageBox.confirm(
        t.value.toolActions.cleanupConfirm,
        t.value.toolActions.cleanupTitle,
        {
          confirmButtonText: t.value.common.confirm,
          cancelButtonText: t.value.common.cancel,
          type: 'warning',
        },
      )

      // 显示加载提示
      const loading = ElMessage({
        message: t.value.toolActions.cleaning,
        type: 'info',
        duration: 0,
      })

      // 调用 Tauri 命令
      const result = await invoke('cleanup_unused_covers')

      loading.close()

      // 显示结果
      if (result.success) {
        if (result.deleted_count > 0) {
          ElMessageBox.alert(
            formatMessage(t.value.toolActions.cleanupSummary, {
              count: result.deleted_count,
              size: (result.freed_space / 1024).toFixed(2),
            }),
            t.value.toolActions.cleanupComplete,
            {
              confirmButtonText: t.value.common.confirm,
              type: 'success',
            },
          )
        } else {
          ElMessage.success(t.value.toolActions.cleanupEmpty)
        }
      } else {
        console.error('Cleanup failed:', result.message)
        ElMessage.error(t.value.toolActions.cleanupFailed)
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('清理文件失败:', error)
        ElMessage.error(t.value.toolActions.cleanupFailed)
      }
    }
  }

  /**
   * 以管理员权限重启 GUI
   */
  const restartAsAdmin = async () => {
    try {
      // 确认对话框
      await ElMessageBox.confirm(t.value.toolActions.elevateConfirm, t.value.toolActions.elevateTitle, {
        confirmButtonText: t.value.common.confirm,
        cancelButtonText: t.value.common.cancel,
        type: 'warning',
      })

      // 显示提示
      ElMessage.info(t.value.toolActions.requestingAdmin)

      // 调用 Tauri 命令
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('restart_as_admin')

      // 如果到这里说明成功请求了重启
      ElMessage.success(t.value.toolActions.restartingAsAdmin)
    } catch (error) {
      if (error !== 'cancel') {
        console.error('重启失败:', error)
        ElMessage.error(t.value.toolActions.restartFailed)
      }
    }
  }

  /**
   * 检查更新，返回 UpdateInfo（包含 is_latest 标记）由调用方处理展示
   */
  /**
   * 公共窗口创建函数
   * @param {string} url - 窗口URL路径
   * @param {string} title - 窗口标题
   * @param {object} options - 窗口配置选项
   */
  const createWindow = async (url, title, options = {}) => {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      const baseUrl = window.location.origin
      const windowId = `${options.prefix || 'window'}_${Date.now()}`

      const newWindow = new WebviewWindow(windowId, {
        url: `${baseUrl}${url}`,
        title,
        width: options.width || 1080,
        height: options.height || 800,
        decorations: options.decorations !== false,
        center: true,
      })

      // 等待窗口创建完成后显示
      newWindow.once('tauri://created', async () => {
        console.log(`✅ ${title}窗口已创建`)
        await newWindow.show()
        await newWindow.setFocus()
        console.log(`✅ ${title}窗口已显示`)
      })

      newWindow.once('tauri://error', (e) => {
        console.error(`❌ ${title}窗口创建失败:`, e)
        ElMessage.error(formatMessage(t.value.toolActions.windowCreateFailed, { title }))
      })
    } catch (error) {
      console.error(`❌ 打开${title}失败:`, error)
      ElMessage.error(formatMessage(t.value.toolActions.windowOpenFailed, { title }))
    }
  }

  /**
   * Clipboard sync is enabled by default whenever the user-session agent is
   * alive. Panel settings show connection status; the action reports details.
   */
  const refreshClipboardSyncStatus = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const status = await invoke('clipboard_sync_status')
      clipboardSyncEnabled.value = status?.transport_state === 'connected' && status?.service_allowed !== false
      return status
    } catch (err) {
      console.warn('[clipboard] status query failed:', err)
      return null
    }
  }

  const showClipboardSyncStatus = async () => {
    const status = await refreshClipboardSyncStatus()
    const msg = t.value.clipboardSync
    if (!status) {
      ElMessage.warning(msg.statusUnavailable)
      return
    }
    if (!status.agent_active || status.transport_state === 'stopped') {
      ElMessage.warning(msg.agentInactive)
    } else if (status.service_allowed === false) {
      ElMessage.warning(msg.serviceDisabled)
    } else if (status.transport_state === 'connected') {
      ElMessage.success(msg.active)
    } else if (status.transport_state === 'connecting') {
      ElMessage.info(msg.connecting)
    } else if (status.transport_state === 'disconnected') {
      const detail = status.last_error ? `: ${status.last_error}` : ''
      ElMessage.warning(`${msg.disconnected}${detail}`)
    } else {
      ElMessage.info(msg.inactive)
    }
  }

  /** Load status once for the panel, then keep the settings page up to date. */
  const initClipboardSyncStatus = async () => {
    if (clipboardSyncInitialised) return
    clipboardSyncInitialised = true
    await refreshClipboardSyncStatus()
    clipboardSyncPollTimer = window.setInterval(refreshClipboardSyncStatus, 5000)
    window.addEventListener(
      'beforeunload',
      () => {
        if (clipboardSyncPollTimer) window.clearInterval(clipboardSyncPollTimer)
        clipboardSyncPollTimer = null
      },
      { once: true },
    )
  }

  return {
    openTimer,
    openStylusInputProbe,
    openUrl,
    cleanupCovers,
    restartAsAdmin,
    showClipboardSyncStatus,
    initClipboardSyncStatus,
    clipboardSyncEnabled,
  }
}
