<template>
  <div class="tool-container">
    <div class="tool-header">
      <h2>{{ t.petTool.title }}</h2>
      <button class="lang-btn" :title="t.petTool.languageDesc" @click="onToggleLocale">
        {{ locale === 'zh' ? 'EN' : '中' }}
      </button>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="tool-body">
      <!-- 左侧侧边栏 -->
      <aside class="sidebar">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          class="sidebar-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="sidebar-icon" v-html="tab.icon" />
          <span class="sidebar-label">{{ t.petTool.tabs[tab.id] }}</span>
        </button>
      </aside>

      <!-- 右侧内容区 -->
      <section
        class="tab-panel"
        @touchstart.passive="onTabTouchStart"
        @touchend.passive="onTabTouchEnd"
        @touchcancel="resetTabTouch"
      >
        <!-- ==================== 对话 ==================== -->
        <div v-if="activeTab === 'speech'" class="panel-content">
          <!-- 总开关 -->
          <div class="row row-master">
            <div class="row-info">
              <div class="row-name">{{ t.petTool.master }}</div>
              <div class="row-desc">{{ t.petTool.masterDesc }}</div>
            </div>
            <div class="row-control">
              <label class="switch">
                <input type="checkbox" v-model="masterEnabled" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <!-- 子项区域 -->
          <div class="sub-area" :class="{ disabled: !masterEnabled }">
            <!-- 随机对话 -->
            <div class="sub-block">
              <div class="row row-section">
                <div class="row-info">
                  <div class="row-name">{{ t.petTool.random }}</div>
                  <div class="row-desc">{{ t.petTool.randomDesc }}</div>
                </div>
                <div class="row-control">
                  <label class="switch">
                    <input
                      type="checkbox"
                      v-model="randomEnabled"
                      :disabled="!masterEnabled"
                    />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
              <div v-if="masterEnabled && randomEnabled" class="row row-detail">
                <div class="row-info">
                  <div class="row-name">{{ t.petTool.speechInterval }}</div>
                  <div class="row-desc">{{ t.petTool.speechIntervalDesc }}</div>
                </div>
                <div class="row-control row-control-stack">
                  <div class="preset-btns">
                    <button
                      v-for="preset in INTERVAL_PRESETS"
                      :key="preset"
                      class="pet-btn small"
                      :class="{ active: randomIntervalSec === preset }"
                      @click="setRandomIntervalPreset(preset)"
                    >
                      {{ formatSec(preset) }}
                    </button>
                  </div>
                  <div class="number-input">
                    <input
                      type="number"
                      v-model.number="randomIntervalSec"
                      :min="MIN_INTERVAL_SEC"
                      :max="MAX_INTERVAL_SEC"
                      step="1"
                      class="number-control"
                    />
                    <span class="unit">{{ t.petTool.unitSec }}</span>
                  </div>
                </div>
              </div>
              <div v-if="masterEnabled && randomEnabled" class="row row-detail">
                <div class="row-info">
                  <div class="row-name">{{ t.petTool.jitter }}</div>
                  <div class="row-desc">{{ t.petTool.jitterDesc }}</div>
                </div>
                <div class="row-control row-control-stack">
                  <div class="preset-btns">
                    <button
                      v-for="preset in JITTER_PRESETS"
                      :key="preset"
                      class="pet-btn small"
                      :class="{ active: jitterPercent === preset }"
                      @click="setJitterPreset(preset)"
                    >
                      {{ preset }}%
                    </button>
                  </div>
                  <div class="number-input">
                    <input
                      type="number"
                      v-model.number="jitterPercent"
                      :min="0"
                      :max="MAX_JITTER_PERCENT"
                      step="1"
                      class="number-control"
                    />
                    <span class="unit">%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div class="panel-footer">
            <button class="pet-btn ghost" :title="t.petTool.resetTooltip" @click="resetSpeechDefaults">
              {{ t.petTool.reset }}
            </button>
          </div>
        </div>

        <!-- ==================== 动画 ==================== -->
        <div v-else-if="activeTab === 'animation'" class="panel-content">
          <div class="empty-hint">{{ t.petTool.animationMore }}</div>
        </div>

        <div v-else-if="activeTab === 'shortcuts'" class="panel-content">
          <div class="row row-master">
            <div class="row-info">
              <div class="row-name">{{ t.petTool.toolbarShortcut }}</div>
              <div class="row-desc">{{ t.petTool.toolbarShortcutDesc }}</div>
              <div v-if="toolbarShortcutUnavailable" class="row-desc warn">
                {{ t.petTool.toolbarShortcutUnavailable }}
              </div>
              <div v-else-if="toolbarShortcutStateError" class="row-desc warn">
                {{ t.petTool.toolbarShortcutStateError }}
              </div>
            </div>
            <div class="row-control">
              <label class="switch">
                <input
                  type="checkbox"
                  :checked="toolbarShortcutEnabled"
                  :aria-label="t.petTool.toolbarShortcut"
                  :disabled="toolbarShortcutPending"
                  @change="onToolbarShortcutToggle"
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useI18n } from '../../desktop/i18n/index.js'
import {
  PET_MASTER_KEY,
  PET_RANDOM_ENABLED_KEY,
  PET_RANDOM_INTERVAL_KEY,
  PET_RANDOM_JITTER_KEY,
  MIN_INTERVAL_SEC,
  MAX_INTERVAL_SEC,
  MAX_JITTER_PERCENT,
  DEFAULT_RANDOM_INTERVAL_SEC,
  DEFAULT_JITTER_PERCENT,
  loadMasterEnabled,
  loadRandomEnabled,
  loadRandomIntervalSec,
  loadJitterPercent,
  notifyPetConfigChanged,
} from '../../composables/petSpeechConfig.js'

const { t, locale, toggleLocale } = useI18n()

defineEmits(['close'])

const TABS = Object.freeze([
  {
    id: 'speech',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 9h10v2H7V9zm6 5H7v-2h6v2zm4-6H7V6h10v2z"/></svg>',
  },
  {
    id: 'animation',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
  },
  {
    id: 'shortcuts',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14H7v-2h4v2zm6-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
  },
])

const INTERVAL_PRESETS = Object.freeze([15, 30, 60, 120, 300])
const JITTER_PRESETS = Object.freeze([0, 15, 30, 50])

const activeTab = ref('speech')
const masterEnabled = ref(loadMasterEnabled())
const randomEnabled = ref(loadRandomEnabled())
const randomIntervalSec = ref(loadRandomIntervalSec())
const jitterPercent = ref(loadJitterPercent())
const toolbarShortcutEnabled = ref(true)
const toolbarShortcutRegistered = ref(false)
const toolbarShortcutPending = ref(true)
const toolbarShortcutStateError = ref(false)
let tabTouchStart = null

const toolbarShortcutUnavailable = computed(
  () => !toolbarShortcutPending.value
    && !toolbarShortcutStateError.value
    && toolbarShortcutEnabled.value
    && !toolbarShortcutRegistered.value,
)

async function loadToolbarShortcutStatus() {
  toolbarShortcutPending.value = true
  toolbarShortcutStateError.value = false
  try {
    const status = await invoke('load_toolbar_shortcut_status')
    toolbarShortcutEnabled.value = Boolean(status.enabled)
    toolbarShortcutRegistered.value = Boolean(status.registered)
  } catch (error) {
    console.warn('[桌宠设置] 加载快捷键状态失败:', error)
    toolbarShortcutStateError.value = true
  } finally {
    toolbarShortcutPending.value = false
  }
}

async function onToolbarShortcutToggle(event) {
  const input = event.currentTarget
  const enabled = input.checked
  toolbarShortcutPending.value = true
  toolbarShortcutStateError.value = false
  try {
    const status = await invoke('set_toolbar_shortcut_enabled', { enabled })
    toolbarShortcutEnabled.value = Boolean(status.enabled)
    toolbarShortcutRegistered.value = Boolean(status.registered)
  } catch (error) {
    console.warn('[桌宠设置] 保存快捷键状态失败:', error)
    input.checked = toolbarShortcutEnabled.value
    toolbarShortcutStateError.value = true
  } finally {
    toolbarShortcutPending.value = false
  }
}

function formatSec(sec) {
  if (sec >= 60) return `${Math.round(sec / 60)} ${t.value.petTool.unitMin}`
  return `${sec} ${t.value.petTool.unitSec}`
}

function onToggleLocale() {
  toggleLocale()
}

function onTabTouchStart(event) {
  if (event.touches.length !== 1) return
  if (event.target?.closest?.('button, input, label, a, [role="button"]')) return

  const touch = event.touches[0]
  tabTouchStart = {
    x: touch.clientX,
    y: touch.clientY,
    startedAt: performance.now(),
  }
}

function resetTabTouch() {
  tabTouchStart = null
}

function onTabTouchEnd(event) {
  const start = tabTouchStart
  resetTabTouch()
  if (!start || event.changedTouches.length !== 1) return

  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - start.x
  const deltaY = touch.clientY - start.y
  const elapsed = performance.now() - start.startedAt
  if (elapsed > 800 || Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
    return
  }

  const currentIndex = TABS.findIndex((tab) => tab.id === activeTab.value)
  const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
  if (nextIndex >= 0 && nextIndex < TABS.length) {
    activeTab.value = TABS[nextIndex].id
  }
}

function emitConfigChanged() {
  notifyPetConfigChanged()
}

function persistSetting(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.warn(`[桌宠设置] 配置持久化失败 (${key}):`, error)
  }
}

function clampInterval(n) {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return MIN_INTERVAL_SEC
  return Math.min(MAX_INTERVAL_SEC, Math.max(MIN_INTERVAL_SEC, v))
}

function clampJitter(n) {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v) || v < 0) return 0
  return Math.min(MAX_JITTER_PERCENT, v)
}

// 护栏：避免 watch 被 clamp 后的写回再次触发
let suppressWatch = false
function safeAssign(refObj, value) {
  if (refObj.value === value) return
  suppressWatch = true
  refObj.value = value
  // 下一个微任务释放，仅拦截本次同步触发的 watch
  Promise.resolve().then(() => { suppressWatch = false })
}

// 总开关
watch(masterEnabled, (v) => {
  if (suppressWatch) return
  persistSetting(PET_MASTER_KEY, String(!!v))
  emitConfigChanged()
})

// 随机对话开关
watch(randomEnabled, (v) => {
  if (suppressWatch) return
  persistSetting(PET_RANDOM_ENABLED_KEY, String(!!v))
  emitConfigChanged()
})

// 随机对话间隔：clamp 后写入
watch(randomIntervalSec, (v) => {
  if (suppressWatch) return
  const c = clampInterval(v)
  if (c !== v) {
    safeAssign(randomIntervalSec, c)
  }
  persistSetting(PET_RANDOM_INTERVAL_KEY, String(c))
  emitConfigChanged()
})

// 拖动幅度
watch(jitterPercent, (v) => {
  if (suppressWatch) return
  const c = clampJitter(v)
  if (c !== v) {
    safeAssign(jitterPercent, c)
  }
  persistSetting(PET_RANDOM_JITTER_KEY, String(c))
  emitConfigChanged()
})

// 桌面观察开关：AI Key 未配置时强制下位
function setRandomIntervalPreset(sec) {
  randomIntervalSec.value = sec
}

function setJitterPreset(pct) {
  jitterPercent.value = pct
}

// 恢复对话相关默认（总开关 / 随机对话 / 桌面观察 / 各间隔）
function resetSpeechDefaults() {
  suppressWatch = true
  masterEnabled.value = true
  randomEnabled.value = true
  randomIntervalSec.value = DEFAULT_RANDOM_INTERVAL_SEC
  jitterPercent.value = DEFAULT_JITTER_PERCENT
  try {
    localStorage.setItem(PET_MASTER_KEY, 'true')
    localStorage.setItem(PET_RANDOM_ENABLED_KEY, 'true')
    localStorage.setItem(PET_RANDOM_INTERVAL_KEY, String(DEFAULT_RANDOM_INTERVAL_SEC))
    localStorage.setItem(PET_RANDOM_JITTER_KEY, String(DEFAULT_JITTER_PERCENT))
  } catch (_) {}
  Promise.resolve().then(() => { suppressWatch = false })
  emitConfigChanged()
}

function syncSettingFromStorage(event) {
  suppressWatch = true
  if (event.key === PET_MASTER_KEY) masterEnabled.value = loadMasterEnabled()
  else if (event.key === PET_RANDOM_ENABLED_KEY) randomEnabled.value = loadRandomEnabled()
  else if (event.key === PET_RANDOM_INTERVAL_KEY) randomIntervalSec.value = loadRandomIntervalSec()
  else if (event.key === PET_RANDOM_JITTER_KEY) jitterPercent.value = loadJitterPercent()
  else {
    suppressWatch = false
    return
  }
  Promise.resolve().then(() => { suppressWatch = false })
}

onMounted(() => {
  window.addEventListener('storage', syncSettingFromStorage)
  void loadToolbarShortcutStatus()
})
onUnmounted(() => window.removeEventListener('storage', syncSettingFromStorage))
</script>

<style lang="less" scoped>
.tool-container {
  width: min(720px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 32px));
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  color: white;
}

.tool-header {
  flex-shrink: 0;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.1);
  position: relative;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
  }
}

.close-btn,
.reset-btn,
.lang-btn {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn {
  top: 10px;
  right: 14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.18);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }
}

.reset-btn {
  top: 12px;
  right: 50px;
  height: 26px;
  padding: 0 12px;
  font-size: 12px;
  border-radius: 13px;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}

.lang-btn {
  top: 12px;
  left: 14px;
  width: 32px;
  height: 26px;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  border-radius: 13px;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}

.tool-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  width: 130px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.18);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  min-height: 44px;
  touch-action: manipulation;
  user-select: none;
  text-align: left;
  transition: background 0.18s, color 0.18s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }

  &.active {
    background: rgba(255, 255, 255, 0.18);
    color: white;
    font-weight: 600;
  }

  .sidebar-icon {
    display: inline-flex;
    width: 18px;
    height: 18px;

    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }
}

.tab-panel {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.panel-content {
  padding: 16px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 100%;
  box-sizing: border-box;
}

.panel-footer {
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.row-master {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  padding: 14px 4px;
  margin-bottom: 4px;

  .row-name {
    font-size: 15px;
  }
}

.sub-area {
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s;

  &.disabled {
    opacity: 0.45;
    pointer-events: none;
  }
}

.sub-block {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;

  & + .sub-block {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }
}

.row-section {
  background: transparent;
  padding: 12px 4px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);

  .row-name {
    font-size: 14px;
    font-weight: 600;
  }
}

.row-detail {
  background: transparent;
  margin: 0;
  padding: 10px 4px 10px 16px;
  border-bottom: none;

  .row-name {
    font-weight: 500;
  }
}

.row-warning {
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.25);
  border-radius: 6px;
  padding: 10px 12px;

  .row-name {
    color: #ffc107;
  }
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.row-desc {
  font-size: 12px;
  opacity: 0.7;
  line-height: 1.4;

  &.warn {
    margin-top: 4px;
    color: #ffb84d;
    opacity: 0.95;
  }
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  font-size: 11px;
  font-weight: 700;
  cursor: help;
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.32);
  }
}

.row-control {
  flex-shrink: 0;
}

.row-control-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 220px;
}

.preset-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.pet-btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &.small {
    padding: 4px 10px;
    font-size: 12px;
    border-radius: 14px;
  }

  &.ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.35);
      color: white;
    }
  }

  &.active {
    background: white;
    color: #2b7fd9;
    border-color: white;
  }

  &:hover:not(.active):not(.ghost) {
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.number-input {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 4px 8px;
}

.number-control {
  width: 80px;
  background: transparent;
  border: none;
  color: white;
  font-size: 13px;
  outline: none;
  text-align: right;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.unit {
  font-size: 12px;
  opacity: 0.7;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.5;
  text-align: center;
  padding: 16px 8px;
  font-style: italic;
}

// 历史回看面板
.history-panel {
  flex-direction: column !important;
  align-items: stretch !important;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 8px;
  padding: 10px 12px !important;
  gap: 8px;
}

.history-empty {
  font-size: 12px;
  opacity: 0.6;
  text-align: center;
  padding: 8px 0;
  font-style: italic;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;

  .history-time {
    flex-shrink: 0;
    opacity: 0.55;
    font-variant-numeric: tabular-nums;
  }

  .history-text {
    flex: 1;
    word-break: break-word;
  }
}

.history-actions {
  display: flex;
  justify-content: flex-end;

  .ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.25);
    opacity: 0.85;
  }
}

.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background: #4ade80;
    }

    &:checked + .slider::before {
      transform: translateX(18px);
    }

    &:disabled + .slider {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .slider {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 24px;
    cursor: pointer;
    transition: 0.2s;

    &::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      top: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.2s;
    }
  }
}
</style>
