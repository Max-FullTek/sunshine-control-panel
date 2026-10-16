import { createApp } from 'vue'
import '../styles/global.less'
import '../desktop/desktop.less'
import AboutView from '../desktop/views/AboutView.vue'
import { useTheme } from '../desktop/composables/useTheme.js'
useTheme()
createApp(AboutView).mount('#app')
