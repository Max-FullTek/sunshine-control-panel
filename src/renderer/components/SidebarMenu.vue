<template>
  <div class="sidebar-wrapper">
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="gura-background" aria-hidden="true">
        <img src="../public/gura-pix.png" alt="" class="gura-bg-img" />
      </div>
      <div class="sidebar-header" data-tauri-drag-region @pointerdown="onTouchWindowDragStart">
        <div class="logo"><img src="../public/gura-pix.png" alt="" class="logo-img" /></div>
        <h3 v-if="!isCollapsed" class="app-name">
          <span>Foundation</span>
          <span>Sunshine</span>
        </h3>
      </div>
      <el-tooltip :content="isCollapsed ? t.sidebar.expand : t.sidebar.collapse" placement="right">
        <button
          type="button"
          class="collapse-btn"
          :aria-label="isCollapsed ? t.sidebar.expand : t.sidebar.collapse"
          :aria-expanded="!isCollapsed"
          @pointerdown.stop
          @click="toggleCollapse"
        >
          <img
            :class="['clip-icon', { collapsed: isCollapsed }]"
            src="../public/gura-clip.svg"
            alt=""
            width="24"
            height="24"
            aria-hidden="true"
          />
        </button>
      </el-tooltip>
      <el-scrollbar class="menu-scrollbar">
        <nav :aria-label="t.sidebar.mainNavigation">
          <section v-for="group in navigationGroups" :key="group.id" class="menu-section" :aria-label="group.label">
            <p v-if="!isCollapsed" class="section-title">{{ group.label }}</p>
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
    </aside>
    <div class="main-content">
      <div class="drag-region" data-tauri-drag-region @pointerdown="onTouchWindowDragStart"></div>
      <div class="window-controls">
        <el-tooltip :content="t.sidebar.minimize" placement="bottom">
          <button type="button" class="control-btn minimize" :aria-label="t.sidebar.minimize" @click="minimizeWindow">
            <img
              class="control-icon"
              src="../public/icons/btn-minimize-buoy.svg"
              alt=""
              width="20"
              height="20"
              aria-hidden="true"
            />
          </button>
        </el-tooltip>
        <el-tooltip :content="isMaximized ? t.sidebar.restore : t.sidebar.maximize" placement="bottom">
          <button
            type="button"
            class="control-btn maximize"
            :aria-label="isMaximized ? t.sidebar.restore : t.sidebar.maximize"
            @click="toggleMaximize"
          >
            <img
              v-if="isMaximized"
              class="control-icon"
              src="../public/icons/btn-restore-buoy.svg"
              alt=""
              width="20"
              height="20"
              aria-hidden="true"
            />
            <img
              v-else
              class="control-icon"
              src="../public/icons/btn-maximize-buoy.svg"
              alt=""
              width="20"
              height="20"
              aria-hidden="true"
            />
          </button>
        </el-tooltip>
        <el-tooltip :content="t.sidebar.hideWindow" placement="bottom">
          <button type="button" class="control-btn close" :aria-label="t.sidebar.hideWindow" @click="closeWindow">
            <img
              class="control-icon"
              src="../public/icons/btn-close-buoy.svg"
              alt=""
              width="20"
              height="20"
              aria-hidden="true"
            />
          </button>
        </el-tooltip>
      </div>
      <div class="page-content">
        <VddSettings v-if="router.isRoute(ROUTES.VDD_SETTINGS)" @close="goHome" />
        <Welcome v-if="router.isRoute(ROUTES.WELCOME)" @close="goHome" />
        <HdrEnhancedManager v-if="router.isRoute(ROUTES.HDR_ENHANCED)" />
        <ControllersHub
          v-if="[ROUTES.CONTROLLERS, ROUTES.DUALSENSE, ROUTES.CONTROLLERS_HUB].some(router.isRoute)"
          @close="goHome"
        />
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
    </div>
  </div>
</template>

<script setup>
import { computed, toRef, watch, onMounted } from 'vue'
import VddSettings from './VddSettings.vue'
import Welcome from './welcome.vue'
import ControllersHub from './controllersHub/ControllersHub.vue'
import HdrEnhancedManager from './HdrEnhancedManager.vue'
import ControlPanelPage from './ControlPanelPage.vue'
import { useSidebarState } from '../composables/useSidebarState.js'
import { useWindowControls } from '../composables/useWindowControls.js'
import { useTools } from '../composables/useTools.js'
import { useTouchWindowDrag } from '../composables/useTouchWindowDrag.js'
import { createNavigationGroups, createFooterTools } from '../composables/toolsRegistry.js'
import { ROUTES } from '../composables/useRouter.js'
import { useI18n } from '../desktop/i18n/index.js'
const props = defineProps({ webuiPath: { type: String, default: '/' } })
const emit = defineEmits(['route-change', 'webui-navigate'])
const { t, locale } = useI18n()
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
  openRtxHdr,
} = useSidebarState()
const { minimizeWindow, toggleMaximize, closeWindow } = useWindowControls(isMaximized)
const { onTouchWindowDragStart } = useTouchWindowDrag(isMaximized)
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
const goHome = () => openWebUi('/')
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
  openRtxHdr,
  goHome,
  router,
})
</script>
<style scoped lang="less">
@import '../styles/SidebarMenu.less';
</style>
