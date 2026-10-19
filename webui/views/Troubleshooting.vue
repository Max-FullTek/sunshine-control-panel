<template>
  <div class="troubleshooting-page">
    <Navbar />
    <div class="container py-4">
      <PageHeader :title="shellT.sidebar.diagnostics" :description="shellT.sidebar.diagnosticsDescription" ><template #icon><IconTroubleshooting /></template></PageHeader>

      <div v-if="desktopAvailable" class="d-flex flex-wrap gap-2 mb-3" role="group" :aria-label="$t('troubleshooting.logs')">
        <button type="button" class="btn" :class="logSource === 'host' ? 'btn-primary' : 'btn-outline-secondary'" :aria-pressed="logSource === 'host'" @click="logSource = 'host'">{{ logText.host }}</button>
        <button type="button" class="btn" :class="logSource === 'desktop' ? 'btn-primary' : 'btn-outline-secondary'" :aria-pressed="logSource === 'desktop'" @click="logSource = 'desktop'">{{ logText.desktop }}</button>
      </div>
      <DesktopLogsPanel v-if="desktopAvailable && logSource === 'desktop'" />
      <LogsSection v-else
        v-model:logFilter="logFilter"
        v-model:matchMode="matchMode"
        v-model:ignoreCase="ignoreCase"
        :actualLogs="actualLogs"
        :copyLogs="copyLogs"
        :copyConfig="handleCopyConfig"
      />

      <!-- Row 1: 重新打开新手引导 | 登出 -->
      <div class="row mb-4">
        <div class="col-lg-6 d-flex">
          <TroubleshootingCard
            class="flex-fill"
            icon="fa-magic"
            color="primary"
            :title="$t('troubleshooting.reopen_setup_wizard')"
            :description="$t('troubleshooting.reopen_setup_wizard_desc')"
          >
            <button class="btn btn-primary" @click="handleReopenSetupWizard">
              <i class="fas fa-redo me-2"></i>
              {{ $t('troubleshooting.reopen_setup_wizard') }}
            </button>
          </TroubleshootingCard>
        </div>
        <div class="col-lg-6 d-flex">
          <TroubleshootingCard
            class="flex-fill"
            icon="fa-sign-out-alt"
            color="danger"
            :title="$t('troubleshooting.logout')"
            :description="$t('troubleshooting.logout_desc')"
          >
            <button class="btn btn-danger" @click="showLogoutModal">
              <i class="fas fa-sign-out-alt me-2"></i>
              {{ $t('troubleshooting.logout') }}
            </button>
          </TroubleshootingCard>
        </div>
      </div>

      <!-- Row 2: 强制关闭 | Boom -->
      <div class="row mb-4">
        <div class="col-lg-6 d-flex">
          <TroubleshootingCard
            class="flex-fill"
            icon="fa-times-circle"
            color="warning"
            :title="$t('troubleshooting.force_close')"
            :description="$t('troubleshooting.force_close_desc')"
          >
            <template #alerts>
              <div class="alert alert-success d-flex align-items-center" v-if="closeAppStatus === true">
                <i class="fas fa-check-circle me-2"></i>
                {{ $t('troubleshooting.force_close_success') }}
              </div>
              <div class="alert alert-danger d-flex align-items-center" v-if="closeAppStatus === false">
                <i class="fas fa-exclamation-circle me-2"></i>
                {{ $t('troubleshooting.force_close_error') }}
              </div>
            </template>
            <button class="btn btn-warning" :disabled="closeAppPressed" @click="closeApp">
              <i class="fas fa-times me-2"></i>
              {{ $t('troubleshooting.force_close') }}
            </button>
          </TroubleshootingCard>
        </div>
        <div class="col-lg-6 d-flex">
          <TroubleshootingCard
            class="flex-fill"
            icon="fa-stop-circle"
            color="danger"
            :title="$t('troubleshooting.boom_sunshine')"
            :description="$t('troubleshooting.boom_sunshine_desc')"
          >
            <template #alerts>
              <div class="alert alert-success d-flex align-items-center" v-if="boomPressed">
                <i class="fas fa-check-circle me-2"></i>
                {{ $t('troubleshooting.boom_sunshine_success') }}
              </div>
            </template>
            <button class="btn btn-danger" :disabled="boomPressed" @click="showBoomModal">
              <i class="fas fa-stop-circle me-2"></i>
              {{ $t('troubleshooting.boom_sunshine') }}
            </button>
          </TroubleshootingCard>
        </div>
      </div>

      <!-- Row 3: 重置显示器设置 | 重启 Sunshine -->
      <div class="row mb-4">
        <div class="col-lg-6 d-flex" v-if="platform === 'windows'">
          <TroubleshootingCard
            class="flex-fill"
            icon="fa-desktop"
            color="primary"
            :title="$t('troubleshooting.reset_display_device_windows')"
            :description="$t('troubleshooting.reset_display_device_desc_windows')"
            pre-line
          >
            <template #alerts>
              <div class="alert alert-success d-flex align-items-center" v-if="resetDisplayDeviceStatus === true">
                <i class="fas fa-check-circle me-2"></i>
                {{ $t('troubleshooting.reset_display_device_success_windows') }}
              </div>
              <div class="alert alert-danger d-flex align-items-center" v-if="resetDisplayDeviceStatus === false">
                <i class="fas fa-exclamation-circle me-2"></i>
                {{ $t('troubleshooting.reset_display_device_error_windows') }}
              </div>
            </template>
            <button
              class="btn btn-primary"
              :disabled="resetDisplayDevicePressed"
              @click="resetDisplayDevicePersistence"
            >
              <i class="fas fa-undo me-2"></i>
              {{ $t('troubleshooting.reset_display_device_windows') }}
            </button>
          </TroubleshootingCard>
        </div>
        <div class="col-lg-6 d-flex">
          <TroubleshootingCard
            class="flex-fill"
            icon="fa-sync-alt"
            color="primary"
            :title="$t('troubleshooting.restart_sunshine')"
            :description="$t('troubleshooting.restart_sunshine_desc')"
          >
            <template #alerts>
              <div class="alert alert-success d-flex align-items-center" v-if="restartPressed">
                <i class="fas fa-check-circle me-2"></i>
                {{ $t('troubleshooting.restart_sunshine_success') }}
              </div>
            </template>
            <button class="btn btn-primary" :disabled="restartPressed" @click="restart">
              <i class="fas fa-redo me-2"></i>
              {{ $t('troubleshooting.restart_sunshine') }}
            </button>
          </TroubleshootingCard>
        </div>
      </div>

    </div>

    <ConfirmDialog
      :show="showBoomConfirmModal"
      dialog-id="boom-confirm"
      :title="$t('troubleshooting.confirm_boom')"
      title-icon="fas fa-stop-circle"
      tone="danger"
      :close-label="$t('_common.close')"
      @close="closeBoomModal"
    >
      <p>{{ $t('troubleshooting.confirm_boom_desc') }}</p>
      <template #actions>
        <button type="button" class="btn btn-secondary" @click="closeBoomModal">{{ $t('_common.cancel') }}</button>
        <button type="button" class="btn btn-danger" @click="confirmBoom">
          <i class="fas fa-bomb me-2"></i>{{ $t('troubleshooting.boom_sunshine') }}
        </button>
      </template>
    </ConfirmDialog>

    <ConfirmDialog
      :show="showLogoutConfirmModal"
      dialog-id="logout-confirm"
      :title="$t('troubleshooting.confirm_logout')"
      title-icon="fas fa-sign-out-alt"
      tone="danger"
      :close-label="$t('_common.close')"
      @close="closeLogoutModal"
    >
      <p>{{ $t('troubleshooting.confirm_logout_desc') }}</p>
      <template #actions>
        <button type="button" class="btn btn-secondary" @click="closeLogoutModal">{{ $t('_common.cancel') }}</button>
        <button type="button" class="btn btn-danger" @click="confirmLogout">
          <i class="fas fa-sign-out-alt me-2"></i>{{ $t('troubleshooting.logout') }}
        </button>
      </template>
    </ConfirmDialog>

    <ConfirmDialog
      :show="showLocalhostLogoutModal"
      dialog-id="localhost-logout-notice"
      :title="$t('troubleshooting.logout')"
      title-icon="fas fa-info-circle"
      :close-label="$t('_common.close')"
      @close="closeLocalhostLogoutModal"
    >
      <p>{{ $t('troubleshooting.logout_localhost_tip') }}</p>
      <template #actions>
        <button type="button" class="btn btn-primary" @click="closeLocalhostLogoutModal">{{ $t('_common.close') }}</button>
      </template>
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Navbar from '../components/layout/Navbar.vue'
import PageHeader from '../components/common/PageHeader.vue'
import IconTroubleshooting from '@/desktop/icons/IconTroubleshooting.vue'
import { useI18n as useShellI18n } from '@/desktop/i18n/index.js'
import TroubleshootingCard from '../components/TroubleshootingCard.vue'
import LogsSection from '../components/LogsSection.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import { useTroubleshooting } from '../composables/useTroubleshooting.js'
import { useLogout } from '../composables/useLogout.js'

import DesktopLogsPanel from '@/shared/DesktopLogsPanel.vue'
import { desktopLogText, hasDesktopLogAccess } from '@/shared/desktop-logs.js'
import { isNativeUiPreview } from '@/shared/preview.js'
const { t: shellT, locale: shellLocale } = useShellI18n()
const desktopAvailable = hasDesktopLogAccess() || isNativeUiPreview()
const logSource = ref(desktopAvailable && location.hash === '#desktop-logs' ? 'desktop' : 'host')
const logText = computed(() => desktopLogText[shellLocale.value] || desktopLogText.en)

const { t } = useI18n()
const { logout } = useLogout()

const {
  platform,
  closeAppPressed,
  closeAppStatus,
  restartPressed,
  boomPressed,
  resetDisplayDevicePressed,
  resetDisplayDeviceStatus,
  logFilter,
  matchMode,
  ignoreCase,
  actualLogs,
  refreshLogs,
  closeApp,
  restart,
  boom,
  resetDisplayDevicePersistence,
  copyLogs,
  copyConfig,
  reopenSetupWizard,
  loadPlatform,
  startLogRefresh,
  stopLogRefresh,
} = useTroubleshooting()

const showBoomConfirmModal = ref(false)
const showLogoutConfirmModal = ref(false)
const showLocalhostLogoutModal = ref(false)

const showBoomModal = () => {
  showBoomConfirmModal.value = true
}

const closeBoomModal = () => {
  showBoomConfirmModal.value = false
}

const confirmBoom = () => {
  closeBoomModal()
  boom()
}

const showLogoutModal = () => {
  showLogoutConfirmModal.value = true
}

const closeLogoutModal = () => {
  showLogoutConfirmModal.value = false
}

const closeLocalhostLogoutModal = () => {
  showLocalhostLogoutModal.value = false
}

const confirmLogout = () => {
  closeLogoutModal()
  showLocalhostLogoutModal.value = false
  stopLogRefresh() // 避免登出后 log 轮询再发请求触发第二次登录框
  logout({
    onLocalhost: () => {
      showLocalhostLogoutModal.value = true
    },
  })
}

const handleCopyConfig = () => copyConfig(t)

const handleReopenSetupWizard = () => reopenSetupWizard(t)

let alive = true, ready = false
const syncLogSource = () => { logSource.value = desktopAvailable && location.hash === '#desktop-logs' ? 'desktop' : 'host' }
onMounted(async () => {
  window.addEventListener('hashchange', syncLogSource)
  await Promise.all([loadPlatform(), logSource.value === 'host' ? refreshLogs() : Promise.resolve()])
  if (!alive) return
  ready = true
  if (logSource.value === 'host') startLogRefresh()
})
watch(logSource, source => {
  history.replaceState(history.state, '', location.pathname + location.search + (source === 'desktop' ? '#desktop-logs' : ''))
  stopLogRefresh()
  if (ready && source === 'host') { refreshLogs(); startLogRefresh() }
})
onBeforeUnmount(() => {
  alive = false
  window.removeEventListener('hashchange', syncLogSource)
})

</script>

<style>
@import '../styles/global.less';
</style>

<style scoped>
.troubleshooting-page {
  min-height: 100vh;
  padding-bottom: var(--spacing-xl);
  color: var(--ui-text-primary);
  background: linear-gradient(180deg, rgba(var(--ui-accent-rgb), 0.06), transparent 28rem);
}

.btn {
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.alert {
  border-radius: 8px;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
}

</style>
