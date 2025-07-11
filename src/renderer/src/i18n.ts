import { createI18n } from 'vue-i18n';
import enMessages from './locales/en.json';
import zhMessages from './locales/zh.json';

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'en', // Set English as default locale for now
  fallbackLocale: 'zh', // Fallback locale
  messages: {
    en: enMessages,
    zh: zhMessages,
  },
});

export default i18n;
