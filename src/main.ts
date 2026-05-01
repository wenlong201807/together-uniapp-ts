import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import imgProxy from '@/directives/img-proxy';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  pinia.use(piniaPluginPersistedstate);

  app.use(pinia);

  // 注册全局指令
  app.directive('img-proxy', imgProxy);

  return {
    app,
  };
}
