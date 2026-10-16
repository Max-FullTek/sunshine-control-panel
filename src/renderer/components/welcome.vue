<template>
  <div class="welcome-page">
    <div class="language-selector">
      <select v-model="currentLocale" @change="handleLocaleChange">
        <option v-for="loc in supportedLocales" :key="loc.code" :value="loc.code">
          {{ loc.name }}
        </option>
      </select>
    </div>

    <div class="container">
      <div class="welcome-header">
        <span class="welcome-name">Foundation Lite</span>
        <h1 class="welcome-title">{{ t('greeting') }}</h1>
      </div>

      <div class="welcome-card">
        <p class="welcome-subtitle">{{ t('create_creds') }}</p>

        <div class="alert-box">
          <span class="alert-icon">⚠</span>
          <span>{{ t('create_creds_alert') }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="welcome-form">
          <div class="form-group">
            <label for="usernameInput">{{ t('username') }}</label>
            <input
              id="usernameInput"
              v-model="formData.username"
              type="text"
              autocomplete="username"
              :placeholder="t('username')"
            />
          </div>

          <div class="form-group">
            <label for="passwordInput">{{ t('password') }}</label>
            <input
              id="passwordInput"
              v-model="formData.password"
              type="password"
              autocomplete="new-password"
              :placeholder="t('password')"
              required
            />
          </div>

          <div class="form-group">
            <label for="confirmPasswordInput">{{ t('confirm_password') }}</label>
            <input
              id="confirmPasswordInput"
              v-model="formData.confirmPassword"
              type="password"
              :class="{ error: showPasswordError }"
              autocomplete="new-password"
              :placeholder="t('confirm_password')"
              required
            />
            <transition name="fade">
              <div v-if="showPasswordError" class="error-message">✗ {{ t('password_mismatch') }}</div>
            </transition>
            <transition name="fade">
              <div v-if="showPasswordSuccess" class="success-message">✓ {{ t('password_match') }}</div>
            </transition>
          </div>

          <button type="submit" class="btn" :class="{ 'btn-loading': loading }" :disabled="loading || !isFormValid">
            <span v-if="!loading">{{ t('login') }}</span>
          </button>

          <transition name="fade">
            <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>
          </transition>
          <transition name="fade">
            <div v-if="successMessage" class="message success">{{ successMessage }}</div>
          </transition>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supportedLocales, setLocale as setI18nLocale, getDefaultLocale } from '../../i18n/index.js'
import { sunshine } from '../tauri-adapter.js'

const REDIRECT_DELAY = 2000

const { t, locale } = useI18n()

const currentLocale = ref(locale.value)
const formData = ref({ username: 'sunshine', password: '', confirmPassword: '' })
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const passwordsMatch = computed(() => {
  const { password, confirmPassword } = formData.value
  return !password || !confirmPassword || password === confirmPassword
})

const showPasswordError = computed(() => !passwordsMatch.value && formData.value.confirmPassword)

const showPasswordSuccess = computed(() =>
  passwordsMatch.value && formData.value.confirmPassword && formData.value.password
)

const isFormValid = computed(() => {
  const { username, password, confirmPassword } = formData.value
  return username && password && confirmPassword && passwordsMatch.value
})

watch(locale, (val) => { currentLocale.value = val })

watch(currentLocale, (val) => {
  if (locale.value !== val) {
    setI18nLocale(val)
    locale.value = val
  }
})

const handleLocaleChange = () => setI18nLocale(currentLocale.value)

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!passwordsMatch.value) {
    errorMessage.value = t('password_mismatch')
    return
  }

  const { username, password, confirmPassword } = formData.value
  if (!username || !password || !confirmPassword) {
    errorMessage.value = `${t('error')} ${t('create_creds')}`
    return
  }

  loading.value = true

  try {
    const proxyUrl = await sunshine.getProxyUrl()
    const response = await fetch(`${proxyUrl}/api/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newUsername: username,
        newPassword: password,
        confirmNewPassword: confirmPassword
      }),
    })

    const result = await response.json()

    if (result.status?.toString() === 'true') {
      successMessage.value = `${t('success')} ${t('welcome_success')}`
      setTimeout(() => {
        window.location.href = `${proxyUrl}/`
      }, REDIRECT_DELAY)
    } else {
      errorMessage.value = `${t('error')} ${result.error || t('server_error')}`
    }
  } catch (err) {
    console.error('Failed to save password:', err)
    errorMessage.value = `${t('error')} ${err.message || t('network_error')}`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const defaultLocale = getDefaultLocale()
  currentLocale.value = defaultLocale
  setI18nLocale(defaultLocale)
})
</script>

<style scoped>
.welcome-page { min-height: 100vh; padding: 72px 24px 32px; background: var(--fd-bg-primary); color: var(--fd-text-primary); }
.container { max-width: 520px; margin: auto; }
.welcome-header { margin-bottom: 24px; }
.welcome-name { color: var(--fd-text-secondary); }
.welcome-title { color: var(--fd-text-primary); font-size: 28px; margin-top: 12px; }
.welcome-card { padding: 28px; background: var(--fd-bg-secondary); border: 1px solid var(--fd-border); border-radius: 8px; }
.welcome-subtitle { color: var(--fd-text-primary); }
.alert-box { display: flex; gap: 12px; padding: 14px; margin: 20px 0; border: 1px solid var(--fd-status-warning); border-radius: 6px; }
.form-group { display: grid; gap: 8px; margin: 18px 0; }
input, select, .btn { font: inherit; color: var(--fd-text-primary); border: 1px solid var(--fd-border); border-radius: 6px; padding: 10px 12px; background: var(--fd-bg-secondary); }
input.error { border-color: var(--fd-status-danger); }
.btn { width: 100%; background: var(--fd-accent); color: var(--fd-bg-secondary); cursor: pointer; }
.btn:disabled { opacity: .55; cursor: not-allowed; }
.btn-loading::after { content: '…'; }
.error-message, .message.error { color: var(--fd-status-danger); }
.success-message, .message.success { color: var(--fd-status-success); }
.message { margin-top: 16px; }
.language-selector { position: absolute; top: 20px; right: 24px; }
input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--fd-accent); outline-offset: 2px; }
</style>
