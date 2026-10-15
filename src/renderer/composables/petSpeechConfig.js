/** Local preset speech settings for the desktop pet. */

// 总开关
export const PET_MASTER_KEY = 'sunshine-pet-speech-enabled'

// 随机对话（本地）
export const PET_RANDOM_ENABLED_KEY = 'sunshine-pet-random-enabled'
export const PET_RANDOM_INTERVAL_KEY = 'sunshine-pet-speech-interval' // 复用旧键，避免历史用户配置丢失
export const PET_RANDOM_JITTER_KEY = 'sunshine-pet-speech-jitter'

export const PET_SPEECH_CHANNEL = 'sunshine-pet-speech'

// 范围与默认值
export const MIN_INTERVAL_SEC = 15
export const MAX_INTERVAL_SEC = 3600
export const DEFAULT_RANDOM_INTERVAL_SEC = 30
export const DEFAULT_JITTER_PERCENT = 30
export const MAX_JITTER_PERCENT = 100

// === 加载器 ===
function readBool(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    return v === 'true'
  } catch {
    return fallback
  }
}

function readInt(key, fallback, min, max) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
  } catch {
    return fallback
  }
}

export function loadMasterEnabled() {
  return readBool(PET_MASTER_KEY, true)
}

export function loadRandomEnabled() {
  return readBool(PET_RANDOM_ENABLED_KEY, true)
}

export function loadRandomIntervalSec() {
  return readInt(PET_RANDOM_INTERVAL_KEY, DEFAULT_RANDOM_INTERVAL_SEC, MIN_INTERVAL_SEC, MAX_INTERVAL_SEC)
}

export function loadJitterPercent() {
  return readInt(PET_RANDOM_JITTER_KEY, DEFAULT_JITTER_PERCENT, 0, MAX_JITTER_PERCENT)
}

export function notifyPetConfigChanged() {
  try {
    const channel = new BroadcastChannel(PET_SPEECH_CHANNEL)
    channel.postMessage({ type: 'config-changed' })
    channel.close()
  } catch {}
}
