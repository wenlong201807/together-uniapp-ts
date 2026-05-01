import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import imgProxy from '@/directives/img-proxy';
// #ifdef H5
import { initVConsole } from '@/utils/vconsole';
// #endif

// #ifdef H5
// 初始化 vConsole（仅开发环境）
initVConsole();
// #endif

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
