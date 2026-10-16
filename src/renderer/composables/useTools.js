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
    openUrl,
    cleanupCovers,
    restartAsAdmin,
    showClipboardSyncStatus,
    initClipboardSyncStatus,
    clipboardSyncEnabled,
  }
}
