<template>
  <div class="sidebar-wrapper">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header" data-tauri-drag-region @pointerdown="onTouchWindowDragStart">
        <a class="brand-link" href="https://github.com/AlkaidLab/foundation-sunshine" target="_blank" rel="noopener noreferrer" aria-label="Foundation Sunshine GitHub" @pointerdown.stop @click.prevent="openAuthorRepo">
          <img :src="sunshineLogo" class="brand-logo" alt="Foundation Sunshine" />
        </a>
        <h3 v-if="!isCollapsed" class="app-name">
          <span>Foundation Sunshine Lite</span>
          <span>Desktop</span>
        </h3>
      </div>
      <el-scrollbar class="menu-scrollbar">
        <nav :aria-label="t.sidebar.mainNavigation">
          <section v-for="group in navigationGroups" :key="group.id" class="menu-section" :aria-label="group.label">
            <el-tooltip
              v-for="item in group.items"
              :key="item.id"
              :content="item.label"
              placement="right"
              :disabled="!isCollapsed"
            >
              <button
                type="button"
                class="menu-item"
                :class="{ active: item.isActive?.() }"
                :aria-current="item.isActive?.() ? 'page' : undefined"
                :aria-label="item.label"
                @click="item.action"
              >
                <el-icon :size="19" aria-hidden="true"><component :is="item.icon" /></el-icon>
                <span v-if="!isCollapsed">{{ item.label }}</span>
              </button>
            </el-tooltip>
          </section>
        </nav>
      </el-scrollbar>
      <nav class="sidebar-footer" :aria-label="t.sidebar.panelSettings">
        <el-tooltip
          v-for="item in footerMenuItems"
          :key="item.id"
          :content="item.label"
          placement="right"
          :disabled="!isCollapsed"
        >
          <button
            type="button"
            class="menu-item"
            :class="{ active: item.isActive?.() }"
            :aria-current="item.isActive?.() ? 'page' : undefined"
            :aria-label="item.label"
            @click="item.action"
          >
            <el-icon :size="19" aria-hidden="true"><component :is="item.icon" /></el-icon>
            <span v-if="!isCollapsed">{{ item.label }}</span>
          </button>
        </el-tooltip>
      </nav>
      <el-tooltip :content="isCollapsed ? t.sidebar.expand : t.sidebar.collapse" placement="bottom">
        <button type="button" class="collapse-btn sidebar-collapse" :aria-label="isCollapsed ? t.sidebar.expand : t.sidebar.collapse" :aria-expanded="!isCollapsed" @pointerdown.stop @click="toggleCollapse">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="isCollapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'" />
          </svg>
        </button>
      </el-tooltip>
    </aside>
    <div class="main-content">
      <div v-if="desktopAvailable" class="drag-region" data-tauri-drag-region @pointerdown="onTouchWindowDragStart"></div>
      <div v-if="desktopAvailable || nativeUiPreview" class="window-controls">
        <el-tooltip :content="t.sidebar.minimize" placement="bottom">
          <button type="button" class="control-btn minimize" :disabled="nativeUiPreview && !desktopAvailable" :aria-label="t.sidebar.minimize" @click="minimizeWindow">
            <svg viewBox="0 0 12 12" class="window-button-icon" aria-hidden="true"><path d="M1 9h10" /></svg>
          </button>
        </el-tooltip>
        <el-tooltip :content="isMaximized ? t.sidebar.restore : t.sidebar.maximize" placement="bottom">
          <button
            type="button"
            class="control-btn maximize"
            :disabled="nativeUiPreview && !desktopAvailable"
            :aria-label="isMaximized ? t.sidebar.restore : t.sidebar.maximize"
            @click="toggleMaximize"
          >
            <svg viewBox="0 0 12 12" class="window-button-icon" aria-hidden="true">
              <path v-if="isMaximized" d="M4 1h7v7M1 4h7v7H1z" />
              <rect v-else x="1" y="1" width="10" height="10" />
            </svg>
          </button>
        </el-tooltip>
        <el-tooltip :content="t.sidebar.hideWindow" placement="bottom">
          <button type="button" class="control-btn close" :disabled="nativeUiPreview && !desktopAvailable" :aria-label="t.sidebar.hideWindow" @click="closeWindow">
            <svg viewBox="0 0 12 12" class="window-button-icon" aria-hidden="true"><path d="m1 1 10 10M11 1 1 11" /></svg>
          </button>
        </el-tooltip>
      </div>
      <div class="page-content">
        <DesktopOnly v-if="router.isRoute(ROUTES.VDD_SETTINGS)"><VddSettings @close="goHome" /></DesktopOnly>
        <Welcome v-if="router.isRoute(ROUTES.WELCOME)" @close="goHome" />
        <DesktopOnly v-if="[ROUTES.CONTROLLERS, ROUTES.DUALSENSE, ROUTES.CONTROLLERS_HUB].some(router.isRoute)">
          <ControllersHub @close="goHome" />
        </DesktopOnly>
        <ControlPanelPage
          v-if="[ROUTES.PANEL_SETTINGS, ROUTES.HELP].some(router.isRoute)"
          :page="router.currentRoute.value"
          :theme-mode="themeMode"
          :locale="locale"
          :current-version="currentVersion"
          :clipboard-sync-enabled="clipboardSyncEnabled"
          :is-admin="isAdmin"
          :actions="toolsCtx"
          @theme-change="setTheme"
          @locale-change="locale = $event"
          @webui-navigate="openWebUi"
        />
        <slot v-if="router.isRoute(ROUTES.HOME)" />
      </div>
      <footer class="host-status" role="status" aria-live="polite" :class="`is-${hostStatus.state}`">
        <span class="status-dot" aria-hidden="true"></span>
        <span>{{ t.hostStatus[hostStatus.state] || t.hostStatus.connecting }}</span>
        <button v-if="['error', 'offline', 'logsUnavailable'].includes(hostStatus.state)" type="button" @click="openWebUi('/troubleshooting')">{{ t.hostStatus.details }}</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef, watch, onMounted } from 'vue'
import DesktopOnly from './DesktopOnly.vue'
import { hasDesktopRuntime } from '../shared/runtime.js'
import { isNativeUiPreview } from '../shared/preview.js'
const desktopAvailable = hasDesktopRuntime()
const nativeUiPreview = isNativeUiPreview()
import sunshineLogo from '../../assets/logo-sunshine-256.png?url'
import VddSettings from './VddSettings.vue'
import Welcome from './welcome.vue'
import ControllersHub from './controllersHub/ControllersHub.vue'
import ControlPanelPage from './ControlPanelPage.vue'
import { useSidebarState } from '../composables/useSidebarState.js'
import { useWindowControls } from '../composables/useWindowControls.js'
import { useTools } from '../composables/useTools.js'
import { useTouchWindowDrag } from '../composables/useTouchWindowDrag.js'
import { createNavigationGroups, createFooterTools } from '../composables/toolsRegistry.js'
import { ROUTES } from '../composables/useRouter.js'
import { useI18n } from '../desktop/i18n/index.js'
const props = defineProps({
  webuiPath: { type: String, default: '/' },
  hostStatus: { type: Object, default: () => ({ state: 'connecting' }) },
})
const emit = defineEmits(['route-change', 'webui-navigate'])
const { t, locale } = useI18n()
const openAuthorRepo = () => {
  const url = 'https://github.com/AlkaidLab/foundation-sunshine'
  if (!desktopAvailable) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  openUrl(url)
}
const {
  isCollapsed,
  isMaximized,
  isAdmin,
  currentVersion,
  router,
  themeMode,
  setTheme,
  toggleCollapse,
  openVddSettings,
  openWelcome,
  openControllers,
  openDualSense,
  openControllersHub,
} = useSidebarState()
const { minimizeWindow, toggleMaximize, closeWindow } = useWindowControls(isMaximized)
const { onTouchWindowDragStart: startWindowDrag } = useTouchWindowDrag(isMaximized)
const onTouchWindowDragStart = (event) => { if (desktopAvailable) startWindowDrag(event) }
const {
  openUrl,
  cleanupCovers,
  restartAsAdmin,
  showClipboardSyncStatus,
  initClipboardSyncStatus,
  clipboardSyncEnabled,
} = useTools()
onMounted(() => {
  initClipboardSyncStatus()
})
const openWebUi = (path) => {
  emit('webui-navigate', path)
  router.goHome()
}
const goHome = () => openWebUi('/config')
const toolsCtx = {
  t,
  router,
  webuiPath: toRef(props, 'webuiPath'),
  openWebUi,
  openControllers,
  openUrl,
  cleanupCovers,
  restartAsAdmin,
  showClipboardSyncStatus,
}
const navigationGroups = computed(() => createNavigationGroups(toolsCtx))
const footerMenuItems = computed(() => createFooterTools(toolsCtx))
watch(
  () => router.currentRoute.value,
  (to, from) => {
    if (to !== from) emit('route-change', { from, to })
  },
)
defineExpose({
  openVddSettings,
  openWelcome,
  openControllers,
  openDualSense,
  openControllersHub,
  goHome,
  router,
})
</script>
<style scoped lang="less">
@import '../styles/SidebarMenu.less';
.window-controls .control-btn {
  width: 46px;
  height: 36px;
  color: var(--fd-text-primary);
  border-left: 1px solid var(--fd-border);
}
.window-controls .control-btn:hover { background: var(--fd-bg-tertiary); }
.window-controls .control-btn.close:hover { background: #c42b1c; color: white; }
.window-controls .control-btn:disabled { cursor: default; background: transparent; color: var(--fd-text-secondary); }
.window-button-icon { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.5; }
</style>
