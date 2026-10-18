import { computed } from 'vue'
import { useI18n } from '../desktop/i18n/index.js'

const messages = {
  zh_TW: {
    welcome: '歡迎使用 Foundation Sunshine Lite', overview: '管理串流主機、應用程式與配對裝置。',
    ready: 'Sunshine 已就緒', firstSetup: '首次使用 · 建立管理帳號', panel: '前往控制面板', setup: '設定精靈', host: '主機名稱', version: '版本',
    pending: '待處理配對請求', empty: '目前沒有待處理請求。請先在 Moonlight 發起配對。',
    expired: '此配對請求已完成或失效，請在 Moonlight 重新發起配對。',
    unavailable: '暫時無法取得配對請求，請稍後重試。', retry: '重新整理', seconds: '秒後到期',
    received: '收到時間', source: '來源', success: 'PIN 已送出，請在 Moonlight 繼續完成配對。',
    failed: '配對失敗，請確認 PIN 碼或重新發起配對。', loading: '正在載入…', error: '無法載入設定，請稍後重試。',
  },
  zh: {
    welcome: '欢迎使用 Foundation Sunshine Lite', overview: '管理串流主机、应用程序与配对设备。',
    ready: 'Sunshine 已就绪', firstSetup: '首次使用 · 创建管理账号', panel: '前往控制面板', setup: '设置向导', host: '主机名称', version: '版本',
    pending: '待处理配对请求', empty: '目前没有待处理请求。请先在 Moonlight 发起配对。',
    expired: '此配对请求已完成或失效，请在 Moonlight 重新发起配对。',
    unavailable: '暂时无法获取配对请求，请稍后重试。', retry: '刷新', seconds: '秒后到期',
    received: '收到时间', source: '来源', success: 'PIN 已发送，请在 Moonlight 继续完成配对。',
    failed: '配对失败，请确认 PIN 码或重新发起配对。', loading: '正在加载…', error: '无法加载设置，请稍后重试。',
  },
  en: {
    welcome: 'Welcome to Foundation Sunshine Lite', overview: 'Manage your streaming host, applications and paired devices.',
    ready: 'Sunshine is ready', firstSetup: 'First time here · Create an admin account', panel: 'Open control panel', setup: 'Setup wizard', host: 'Host name', version: 'Version',
    pending: 'Pending pairing requests', empty: 'No pending requests. Start pairing in Moonlight first.',
    expired: 'This request has completed or expired. Start pairing again in Moonlight.',
    unavailable: 'Pairing requests are unavailable. Please try again.', retry: 'Refresh', seconds: 'seconds remaining',
    received: 'Received', source: 'Source', success: 'PIN submitted. Continue pairing in Moonlight.',
    failed: 'Pairing failed. Check the PIN or start pairing again.', loading: 'Loading…', error: 'Unable to load settings. Please try again.',
  },
}
export function useNavigationCopy() {
  const { locale } = useI18n()
  return computed(() => messages[locale.value] || messages.en)
}
