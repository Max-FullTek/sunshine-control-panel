<template>
  <div class="panel-page">
    <PageHeading :title="heading.title" :description="heading.description">
      <template #icon><el-icon><Setting v-if="page === ROUTES.PANEL_SETTINGS" /><QuestionFilled v-else /></el-icon></template>
    </PageHeading>
    <template v-if="page === ROUTES.PANEL_SETTINGS">
      <section class="panel-section">
        <h2>{{ t.sidebar.appearanceLanguage }}</h2>
        <div class="settings-card">
          <div class="settings-row">
            <label for="panel-theme">{{ t.sidebar.theme }}</label>
            <el-select id="panel-theme" :model-value="themeMode" @update:model-value="emit('theme-change', $event)">
              <el-option :label="t.sidebar.lightMode" value="light" />
              <el-option :label="t.sidebar.darkMode" value="dark" />
            </el-select>
          </div>
          <div class="settings-row">
            <label for="panel-language">{{ t.sidebar.language }}</label>
            <el-select id="panel-language" :model-value="locale" @update:model-value="emit('locale-change', $event)">
              <el-option label="繁體中文" value="zh_TW" />
              <el-option label="简体中文" value="zh" />
              <el-option label="English" value="en" />
            </el-select>
          </div>
        </div>
      </section>
      <DesktopOnly><DesktopPreferences /></DesktopOnly>
      <DesktopOnly>
      <section class="panel-section">
        <h2>{{ t.sidebar.syncFeatures }}</h2>
        <div class="settings-card">
          <div class="settings-row">
            <div>
              <strong>{{ t.sidebar.clipboardSync }}</strong>
              <p>{{ t.sidebar.clipboardDescription }}</p>
            </div>
            <div class="row-actions">
              <el-tag :type="clipboardSyncEnabled ? 'success' : 'info'">
                {{ clipboardSyncEnabled ? t.sidebar.connected : t.sidebar.notConnected }}
              </el-tag>
              <el-button @click="actions.showClipboardSyncStatus">{{ t.sidebar.viewStatus }}</el-button>
            </div>
          </div>
        </div>
      </section>
      </DesktopOnly>
      <section class="panel-section">
        <h2>{{ t.sidebar.accountSettings }}</h2>
        <div class="settings-card">
          <div class="settings-row">
            <div>
              <strong>{{ t.sidebar.accountCredentials }}</strong>
              <p>{{ t.sidebar.accountDescription }}</p>
            </div>
            <el-button @click="emit('webui-navigate', '/password')">{{ t.sidebar.configure }}</el-button>
          </div>
          <div class="settings-row">
            <div>
              <strong>{{ t.sidebar.logout }}</strong>
              <p>{{ t.sidebar.logoutDescription }}</p>
            </div>
            <el-button type="danger" plain @click="emit('webui-navigate', '/password#logout')">
              {{ t.sidebar.logout }}
            </el-button>
          </div>
        </div>
      </section>
      <DesktopOnly v-if="!isAdmin"><el-button @click="actions.restartAsAdmin">{{ t.sidebar.restartAsAdmin }}</el-button></DesktopOnly>
    </template>
    <template v-else>
      <div class="settings-card">
        <div v-for="link in referenceLinks" :key="link.url" class="settings-row">
          <strong>{{ link.name }}</strong>
          <el-button @click="actions.openUrl(link.url)">{{ t.sidebar.visit }}</el-button>
        </div>
        <div class="settings-row">
          <div>
            <strong>{{ t.sidebar.diagnostics }}</strong>
            <p>{{ t.sidebar.diagnosticsDescription }}</p>
          </div>
          <el-button @click="emit('webui-navigate', '/troubleshooting')">{{ t.sidebar.open }}</el-button>
        </div>
      </div>
      <p class="version-note">Foundation Desktop · {{ currentVersion }}</p>
    </template>
  </div>
</template>
<script setup>
import PageHeading from './PageHeading.vue'
import DesktopOnly from './DesktopOnly.vue'
import { Setting, QuestionFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import DesktopPreferences from '../desktop/views/SettingsView.vue'
import { TopRight } from '@element-plus/icons-vue'
import { useI18n } from '../desktop/i18n/index.js'
import { referenceLinks } from '../shared/referenceLinks.js'
import { ROUTES } from '../composables/useRouter.js'
const props = defineProps({
  page: { type: String, required: true },
  themeMode: { type: String, default: 'dark' },
  locale: { type: String, default: 'en' },
  currentVersion: { type: String, default: '' },
  clipboardSyncEnabled: Boolean,
  isAdmin: Boolean,
  actions: { type: Object, required: true },
})
const emit = defineEmits(['theme-change', 'locale-change', 'webui-navigate'])
const { t } = useI18n()
const heading = computed(() => {
  const s = t.value.sidebar
  if (props.page === ROUTES.PANEL_SETTINGS) return { title: s.panelSettings, description: s.panelSettingsDescription }
  return { title: s.helpAbout, description: 'Foundation Sunshine' }
})
</script>
<style scoped lang="less">
.panel-page {
  --panel-surface: var(--fd-bg-secondary);
  --panel-text: var(--fd-text-primary);
  --panel-muted: var(--fd-text-secondary);
  --panel-border: rgba(var(--fd-text-primary-rgb), .16);
  --panel-accent: var(--fd-accent);
  max-width: 1440px;
  margin: 0 auto;
  padding: 52px 24px 32px;
  color: var(--panel-text);
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
:global([data-bs-theme='light'] .panel-page) {
  --panel-surface: var(--fd-bg-secondary);
  --panel-text: var(--fd-text-primary);
  --panel-muted: var(--fd-text-secondary);
  --panel-border: rgba(var(--fd-text-primary-rgb), .16);
  --panel-accent: var(--fd-accent);
}
.panel-heading {
  margin-bottom: 27px;
  h1 {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 10px;
  }
  p {
    color: var(--panel-muted);
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
  }
}
.panel-section {
  margin-bottom: 25px;
  h2 {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 12px;
  }
}
.settings-card,
.tool-card {
  background: var(--panel-surface);
  border: 1px solid var(--panel-border);
  border-radius: 16px;
}
.settings-card {
  padding: 4px 22px;
}
.settings-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 19px 0;
  border-bottom: 1px solid var(--panel-border);
  font-size: 14px;
  &:last-child {
    border-bottom: 0;
  }
  strong {
    font-weight: 500;
  }
  p {
    color: var(--panel-muted);
    font-size: 12px;
    line-height: 1.6;
    margin: 5px 0 0;
  }
  :deep(.el-select) {
    width: 175px;
  }
  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  :deep(.el-radio) {
    margin-right: 10px;
  }
}
.row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.tool-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 23px;
  text-align: left;
  cursor: pointer;
  color: var(--panel-text);
  font: inherit;
  min-width: 0;
  > .el-icon {
    color: var(--panel-accent);
    flex-shrink: 0;
  }
  span {
    min-width: 0;
    flex: 1;
  }
  strong {
    display: block;
    font-weight: 500;
    font-size: 15px;
  }
  small {
    display: block;
    font-size: 12px;
    line-height: 1.6;
    color: var(--panel-muted);
    margin-top: 6px;
  }
  &:hover {
    border-color: var(--panel-accent);
  }
  .external-icon {
    margin-left: auto;
  }
}
.version-note {
  color: var(--panel-muted);
  margin-top: 20px;
  font-size: 12px;
}
@media (max-width: 850px) {
  .panel-page {
    padding: 24px 18px;
  }
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .settings-card {
    padding: 4px 16px;
  }
  .settings-row :deep(.el-select) {
    width: 100%;
  }
  .panel-heading h1 {
    font-size: 23px;
  }
}
</style>
