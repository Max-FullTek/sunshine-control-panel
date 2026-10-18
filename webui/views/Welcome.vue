<template>
  <div class="foundation-connection welcome-page" :data-found="Boolean(hostConfig)" :data-first-run="accountLoaded && !hasAccount">
    <div class="ss-page">
      <header class="ss-chrome">
        <span class="welcome-brand">Foundation Sunshine Lite</span>
        <select v-if="accountLoaded && !hasAccount" id="localeSelect" v-model="selectedLocale"
          class="form-select form-select-sm" aria-label="Language" @change="changeLanguage">
              <option value="en">English</option>
              <option value="en_GB">English (UK)</option>
              <option value="en_US">English (US)</option>
              <option value="zh">简体中文</option>
              <option value="zh_TW">繁體中文</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="ru">Русский</option>
              <option value="uk">Українська</option>
              <option value="pt">Português</option>
              <option value="pt_BR">Português (Brasil)</option>
              <option value="pl">Polski</option>
              <option value="sv">Svenska</option>
              <option value="tr">Türkçe</option>
              <option value="cs">Čeština</option>
              <option value="bg">Български</option>
        </select>
      </header>
      <main id="content">
        <div class="welcome-artwork" aria-hidden="true" v-html="radar"></div>
        <h1>{{ !accountLoaded ? copy.loading : hasAccount ? copy.welcome : $t('welcome.greeting') }}</h1>
        <p v-if="accountLoaded" class="welcome-description">{{ hasAccount ? copy.overview : $t('welcome.create_creds') }}</p>
        <div class="ss-status" role="status">
          <span class="ss-dot" aria-hidden="true"></span>
          <span>{{ accountError ? copy.error : !accountLoaded ? copy.loading : hasAccount ? copy.ready : copy.firstSetup }}</span>
        </div>
        <p v-if="accountError" class="alert alert-danger mt-4" role="alert">{{ copy.error }}</p>
        <section v-if="hasAccount" class="welcome-overview" :aria-label="copy.host">
          <dl v-if="hostConfig" class="welcome-details">
            <div><dt>{{ copy.host }}</dt><dd>{{ hostConfig.sunshine_name }}</dd></div>
            <div><dt>{{ copy.version }}</dt><dd>{{ hostConfig.version }}</dd></div>
          </dl>
          <div class="welcome-actions">
            <a class="btn btn-primary" href="/config">{{ copy.panel }} <i class="fas fa-arrow-right ms-2" aria-hidden="true"></i></a>
            <button type="button" class="btn btn-outline-secondary" @click="openWizard">{{ copy.setup }}</button>
          </div>
        </section>
        <section v-if="accountLoaded && !hasAccount" class="welcome-account" :aria-label="$t('welcome.create_creds')">
          <div class="alert alert-warning welcome-account-note">
            <i class="fas fa-shield-alt" aria-hidden="true"></i>
            <div>{{ $t('welcome.create_creds_alert') }}<br>{{ $t('welcome.creds_local_only') }}</div>
          </div>
            <form @submit.prevent="save">
              <div class="row justify-content-center">
                <div class="col-12">
                  <div class="mb-3">
                    <label for="usernameInput" class="form-label">
                      <i class="fas fa-user me-2"></i>{{ $t('welcome.username') }}
                    </label>
                    <input
                      type="text"
                      class="form-control"
                      id="usernameInput"
                      autocomplete="username"
                      v-model="passwordData.newUsername"
                      :placeholder="$t('welcome.username')"
                    />
                  </div>

                  <div class="mb-3">
                    <label for="passwordInput" class="form-label">
                      <i class="fas fa-lock me-2"></i>{{ $t('welcome.password') }}
                    </label>
                    <input
                      type="password"
                      class="form-control"
                      id="passwordInput"
                      autocomplete="new-password"
                      v-model="passwordData.newPassword"
                      :placeholder="$t('welcome.password')"
                      required
                    />
                  </div>

                  <div class="mb-3">
                    <label for="confirmPasswordInput" class="form-label">
                      <i class="fas fa-check-circle me-2"></i>{{ $t('welcome.confirm_password') }}
                    </label>
                    <input
                      type="password"
                      class="form-control"
                      :class="{ 'is-invalid': !passwordsMatch && passwordData.confirmNewPassword }"
                      id="confirmPasswordInput"
                      autocomplete="new-password"
                      v-model="passwordData.confirmNewPassword"
                      :placeholder="$t('welcome.confirm_password')"
                      required
                    />
                    <div class="invalid-feedback d-block" v-if="!passwordsMatch && passwordData.confirmNewPassword">
                      <i class="fas fa-exclamation-circle me-1"></i>{{ $t('welcome.password_mismatch') }}
                    </div>
                    <div
                      class="valid-feedback d-block"
                      v-if="passwordsMatch && passwordData.confirmNewPassword && passwordData.newPassword"
                    >
                      <i class="fas fa-check-circle me-1"></i>{{ $t('welcome.password_match') }}
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="loading || !isFormValid">
                    <span
                      v-if="loading"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <i v-else class="fas fa-sign-in-alt me-2"></i>
                    {{ $t('welcome.login') }}
                  </button>

                  <transition name="fade">
                    <div class="alert alert-danger" v-if="error">
                      <i class="fas fa-exclamation-circle me-2"></i>
                      <strong>{{ $t('welcome.error') }}</strong>
                      <span v-if="error.startsWith('welcome.')">{{ $t(error) }}</span>
                      <span v-else>{{ error }}</span>
                    </div>
                  </transition>

                  <transition name="fade">
                    <div class="alert alert-success" v-if="success">
                      <i class="fas fa-check-circle me-2"></i>
                      <strong>{{ $t('welcome.success') }}</strong> {{ $t('welcome.welcome_success') }}
                    </div>
                  </transition>
                </div>
              </div>
            </form>
        </section>
      </main>
    </div>
  </div>
  <SetupDialog v-if="hasAccount" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWelcome } from '../composables/useWelcome.js'
import radar from '@/shared/connection-radar.html?raw'
import '@/shared/connection-screen.css'
import SetupDialog from '../components/SetupDialog.vue'
import { apiJson } from '../utils/apiFetch.js'
import { useNavigationCopy } from '@/shared/navigationCopy.js'
import { setShellLocale } from '@/desktop/i18n/index.js'
import { getBootstrapLocale } from '../config/bootstrapData.js'
import { useTheme } from '@/desktop/composables/useTheme.js'

const { locale, setLocaleMessage } = useI18n()
const selectedLocale = ref('en')
const hasAccount = ref(false), accountLoaded = ref(false), accountError = ref(false), hostConfig = ref(null)
const copy = useNavigationCopy()
const openWizard = () => window.dispatchEvent(new Event('open-setup-wizard'))

const { error, success, loading, passwordData, passwordsMatch, isFormValid, save } = useWelcome()

useTheme()

// 加载语言（使用静态嵌入的翻译数据）
const loadLanguage = async (lang) => {
  if (hasAccount.value) {
    const catalog = await apiJson(`/assets/locale/${lang}.json`)
    setLocaleMessage(lang, catalog)
    locale.value = lang
    setShellLocale(lang)
    document.documentElement.lang = lang.replaceAll('_', '-')
    return
  }
  setShellLocale(lang)
  const welcomeLocales = window.__WELCOME_LOCALES__
  
  if (welcomeLocales && welcomeLocales[lang]) {
    // 使用嵌入的翻译数据设置到 i18n
    setLocaleMessage(lang, welcomeLocales[lang])
    locale.value = lang
    document.querySelector('html').setAttribute('lang', lang.replaceAll('_', '-'))
  } else {
    // 如果没有找到，使用英文
    locale.value = 'en'
    document.querySelector('html').setAttribute('lang', 'en')
  }
}

// 加载当前语言设置
onMounted(async () => {
  try {
    // 使用 /api/configLocale，这个 API 不需要认证（在 welcome 页面时可能还没有账号）
    const config = await getBootstrapLocale()
    hasAccount.value = config.has_account === true || config.has_account === 'true'
    accountLoaded.value = true
    if (hasAccount.value) {
      hostConfig.value = await apiJson('/api/config')
      if (hostConfig.value.setup_wizard_completed !== true && hostConfig.value.setup_wizard_completed !== 'true') openWizard()
    }
    if (config.locale) {
      selectedLocale.value = config.locale
      await loadLanguage(config.locale)
    } else {
      loadLanguage('en')
    }
  } catch (e) {
    accountError.value = true
    console.error('Failed to load locale config', e)
    loadLanguage('en')
  }
})

// 切换语言
const changeLanguage = () => {
  loadLanguage(selectedLocale.value)
}
</script>

<style scoped>
.welcome-page { position: relative; z-index: 1; }
.welcome-page .ss-page { border-radius: 0; }
.welcome-page .ss-chrome { justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.welcome-brand { font-weight: 600; }
.ss-chrome .form-select { width: auto; max-width: 100%; }
.welcome-page main { padding-top: clamp(32px, 6vh, 64px); }
.welcome-page h1 { font-size: clamp(24px, 3vw, 30px); font-weight: 600; line-height: 1.4; margin: 26px 0 10px; }
.welcome-page .welcome-description { max-width: 540px; }
.welcome-artwork { width: 244px; height: 244px; flex-shrink: 0; }
.welcome-page[data-first-run='true'] main { padding-top: 28px; }
.welcome-page[data-first-run='true'] .welcome-artwork { height: 172px; }
.welcome-page[data-first-run='true'] :deep(.ss-radar) { transform: scale(.7); transform-origin: top center; }
.welcome-artwork :deep(.ss-ray) { --ss-distance: 48px; --ss-direction: -40deg; }
.welcome-page[data-found='false'] :deep(.ss-sweep) { animation: welcome-sweep 7s linear infinite; }
@keyframes welcome-sweep { to { transform: rotate(360deg); } }
.welcome-overview, .welcome-account { width: min(100%, 540px); margin-top: 30px; }
.welcome-details { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; text-align: left; padding: 20px 24px; border: 1px solid var(--ui-border); border-radius: 14px; background: var(--ui-surface); margin: 0 0 24px; }
.welcome-details dt { color: var(--ui-text-secondary); font-size: 12px; font-weight: 500; margin-bottom: 6px; }
.welcome-details dd { overflow-wrap: anywhere; font-size: 14px; margin: 0; }
.welcome-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; }
.welcome-actions .btn { padding: 10px 20px; font-size: 14px; }
.welcome-page .btn-outline-secondary { color: var(--ui-text-primary); background: transparent; border-color: var(--ui-border); }
.welcome-page .btn-outline-secondary:hover { background: var(--ui-surface-hover); }
.welcome-account { text-align: left; padding: 24px; border: 1px solid var(--ui-border); border-radius: 16px; background: var(--ui-surface); }
.welcome-account-note { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.7; }
.welcome-account-note i { margin-top: 4px; }
.welcome-account .form-label { font-size: 14px; font-weight: 500; }
.welcome-account .form-control { min-height: 44px; }
.welcome-account .alert { max-width: none; }
@media(max-width: 480px) {
  .welcome-details { grid-template-columns: 1fr; gap: 16px; padding: 18px; }
  .welcome-account { padding: 18px; }
  .welcome-actions { flex-direction: column; }
  .welcome-actions .btn { width: 100%; }
}
</style>
