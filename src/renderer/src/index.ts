import { createApp } from 'vue';
import App from './App.vue';
// import './samples/node-api'
import { createPinia, setActivePinia } from 'pinia';
import i18n from './i18n'; // Import the i18n configuration
import './theme.css'; // It seems theme.css was missing, added it back based on previous plan

const pinia = createPinia();
setActivePinia(pinia);  // App 在构建过程中，顶层就 import 了 store，所以要在 createApp 之前就初始化好

const app = createApp(App);
app.use(pinia); // It seems pinia was not used, added it back
app.use(i18n); // Use vue-i18n
app.mount('#app');
//   .$nextTick(window.removeLoading)
