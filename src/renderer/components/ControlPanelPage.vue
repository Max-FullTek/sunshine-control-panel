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
            <div class="reference-copy"><label for="panel-language">{{ t.sidebar.language }}</label><p>{{ t.localeHelp.interface }}</p></div>
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
            <el-button @click="emit('webui-navigate', '/config#account')">{{ t.sidebar.configure }}</el-button>
          </div>
          <div class="settings-row">
            <div>
              <strong>{{ t.sidebar.logout }}</strong>
              <p>{{ t.sidebar.logoutDescription }}</p>
            </div>
            <el-button type="danger" plain @click="emit('webui-navigate', '/config#logout')">
              {{ t.sidebar.logout }}
            </el-button>
          </div>
        </div>
      </section>
      <DesktopOnly v-if="!isAdmin"><el-button @click="actions.restartAsAdmin">{{ t.sidebar.restartAsAdmin }}</el-button></DesktopOnly>
    </template>
    <template v-else>
      <div class="about-layout">
        <article class="about-hero settings-card">
          <div class="about-hero-copy">
            <span class="about-eyebrow">FOUNDATION SUNSHINE LITE</span>
            <h2>{{ t.aboutLite.introSections[0].title }}</h2>
            <p>{{ t.aboutLite.introSections[0].body }}</p>
            <a class="about-repository" :href="liteRepositoryUrl" target="_blank" rel="noopener noreferrer" @click.prevent="actions.openUrl(liteRepositoryUrl)">{{ t.aboutLite.forkLink }} <span aria-hidden="true">↗</span></a>
            <span class="about-version">{{ displayVersion }}</span>
          </div>
          <div class="about-art"><img :src="themeMode === 'dark' ? sunshineLiteLogoDark : sunshineLiteLogo" class="about-brand" alt="Sunshine Lite" /></div>
        </article>
        <div class="about-principles">
          <section v-for="(section, index) in t.aboutLite.introSections.slice(1)" :key="section.title" class="about-principle">
            <span class="about-number" aria-hidden="true">0{{ index + 1 }}</span>
            <div><h3>{{ section.title }}</h3><p>{{ section.body }}</p></div>
          </section>
        </div>
        <section class="about-references">
          <div class="about-section-heading"><h2>{{ t.aboutLite.referencesTitle }}</h2></div>
          <div class="about-reference-grid">
            <a v-for="link in referenceLinks" :key="link.id" class="about-reference settings-card" :href="link.url" target="_blank" rel="noopener noreferrer" @click.prevent="actions.openUrl(link.url)">
              <div><h3>{{ link.name }}</h3><p>{{ t.aboutLite.referenceDescriptions[link.id] }}</p></div>
              <span class="about-reference-arrow" aria-hidden="true">↗</span>
              <span class="about-reference-action">{{ link.id === 'resources' ? t.sidebar.visit : t.aboutLite.starLink }}</span>
            </a>
          </div>
          <p class="about-support-note"><strong>{{ t.aboutLite.supportTitle }}</strong> {{ t.aboutLite.supportBody }}</p>
        </section>
        <div class="about-footer-grid">
          <section v-for="project in driverProjects" :key="project.id" class="about-footer-card settings-card">
            <h2>{{ t.aboutLite.driverProjects[project.id].title }}</h2><p>{{ t.aboutLite.driverProjects[project.id].body }}</p>
            <a :href="project.url" target="_blank" rel="noopener noreferrer" @click.prevent="actions.openUrl(project.url)">{{ t.sidebar.visit }} GitHub ↗</a>
          </section>
          <section class="about-footer-card settings-card">
            <h2>{{ t.sidebar.diagnostics }}</h2><p>{{ t.sidebar.diagnosticsDescription }}</p>
            <el-button @click="emit('webui-navigate', '/troubleshooting')">{{ t.sidebar.open }} <span aria-hidden="true">→</span></el-button>
          </section>
        </div>
        <p class="about-license">{{ t.lite.licenseNotice }}</p>
      </div>
    </template>
  </div>
</template>
<script setup>
import PageHeading from './PageHeading.vue'
import sunshineLiteLogo from '../../assets/sunshine-lite-logo.png?url'
import sunshineLiteLogoDark from '../../assets/sunshine-lite-logo-dark.png?url'
import DesktopOnly from './DesktopOnly.vue'
import { Setting, QuestionFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import DesktopPreferences from '../desktop/views/SettingsView.vue'
import { useI18n } from '../desktop/i18n/index.js'
import { referenceLinks, liteRepositoryUrl, driverProjects } from '../shared/referenceLinks.js'
import { isNativeUiPreview } from '../shared/preview.js'
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
const displayVersion = computed(() => isNativeUiPreview() ? t.value.aboutLite.previewVersion : props.currentVersion)
const heading = computed(() => {
  const s = t.value.sidebar
  if (props.page === ROUTES.PANEL_SETTINGS) return { title: s.panelSettings, description: t.value.pageNotes.interfaceSettings }
  return { title: s.helpAbout, description: t.value.pageNotes.help }
})
</script>
<style scoped lang="less">
.about-brand {
  display: block;
  width: 100%;
  height: auto;
}
.panel-page {
  --panel-surface: var(--fd-bg-secondary);
  --panel-text: var(--fd-text-primary);
  --panel-muted: var(--fd-text-secondary);
  --panel-border: rgba(var(--fd-text-primary-rgb), .16);
  --panel-accent: var(--fd-accent);
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px 32px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--panel-text);
  font-family: var(--ui-font-family);
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
.reference-copy { flex:1; min-width:180px; }
.about-layout { --panel-accent:var(--ui-accent-text); display:grid; gap:28px; }
.about-hero.settings-card { display:grid; grid-template-columns:minmax(0, 1.15fr) minmax(240px, .85fr); padding:0; overflow:hidden; }
.about-hero-copy { padding:clamp(24px, 3vw, 44px); align-self:center; }
.about-eyebrow { display:block; color:var(--panel-accent); font-size:11px; font-weight:600; letter-spacing:.13em; margin-bottom:16px; }
.about-hero h2 { font-size:clamp(25px, 2.6vw, 34px); font-weight:600; margin:0 0 18px; line-height:1.35; }
.about-layout p { font-size:14px; color:var(--panel-muted); line-height:1.85; margin:0; }
.about-layout a { text-decoration:none; }
.about-repository { display:inline-flex; align-items:center; gap:14px; background:var(--ui-action-primary, var(--panel-accent)); color:var(--ui-action-contrast, #fff); border-radius:9px; padding:11px 16px; margin-top:24px; font-size:13px; font-weight:500; }
.about-repository:hover { filter:brightness(1.1); }
.about-version { display:block; color:var(--panel-muted); font-size:11px; margin-top:12px; }
.about-art { display:flex; align-items:center; justify-content:center; padding:20px; }
.about-principles { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:28px; }
.about-principle { display:flex; gap:16px; padding:4px 0; }
.about-number { font-size:13px; color:var(--panel-accent); padding-top:3px; font-variant-numeric:tabular-nums; }
.about-layout h3 { font-size:15px; font-weight:600; margin:0 0 8px; line-height:1.5; }
.about-section-heading h2, .about-footer-card h2 { font-size:17px; font-weight:600; margin:0 0 16px; }
.about-reference-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
.about-reference.settings-card { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:16px; padding:22px; color:var(--panel-text); transition:border-color .18s, transform .18s; }
.about-reference:hover { border-color:var(--panel-accent); transform:translateY(-2px); }
.about-reference p { font-size:12px; }
.about-reference-arrow { color:var(--panel-accent); font-size:21px; }
.about-reference-action { grid-column:1 / -1; font-size:12px; color:var(--panel-accent); }
.about-support-note { padding:14px 2px 0; font-size:12px !important; }
.about-support-note strong { color:var(--panel-text); font-weight:500; margin-right:8px; }
.about-footer-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }
.about-footer-card:last-child { grid-column:1 / -1; }
.about-footer-card.settings-card { padding:22px; }
.about-footer-card p { font-size:13px; }
.about-footer-card a { display:inline-block; color:var(--panel-accent); font-size:13px; margin-top:16px; }
.about-footer-card .el-button { margin-top:16px; }
.about-layout a:focus-visible { outline:2px solid var(--panel-accent); outline-offset:4px; }
.about-license { border-top:1px solid var(--panel-border); padding-top:18px; font-size:11px !important; }
@media (max-width: 1000px) {
  .about-hero.settings-card { grid-template-columns:minmax(0, 1fr) minmax(200px, .7fr); }
  .about-hero-copy { padding:24px; }
  .about-art { padding:12px; }
}
@media (max-width: 650px) {
  .about-hero.settings-card, .about-principles, .about-reference-grid, .about-footer-grid { grid-template-columns:minmax(0, 1fr); }
  .about-art { grid-row:1; padding:12px; }
  .about-brand { max-width:270px; }
  .about-layout { gap:22px; }
  .about-principles { gap:20px; }
}
:deep(.page-heading) { padding-top:0; }
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
