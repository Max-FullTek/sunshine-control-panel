import { createApp } from 'vue';
import '../shared/palette.css';
import LogConsoleApp from './LogConsoleApp.vue';

const app = createApp(LogConsoleApp);
app.mount('#app');
