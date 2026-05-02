<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useAuthStore, useNotificationStore } from '@/stores';
import { useNPS } from '@/composables/useNPS';
import { wsManager } from '@/utils';
import NPSModal from '@/components/business/NPSModal.vue';
import MessageBubbleContainer from '@/components/business/MessageBubbleContainer.vue';
// #ifdef H5
import { initVConsole } from '@/utils/vconsole';
import { getPublicConfigWithCache } from '@/api/modules/system-config';
// #endif

const { npsVisible, npsTriggerType, npsTriggerScene, closeNPS, onNPSSuccess } = useNPS();
const notificationStore = useNotificationStore();

// 监听页面切换，更新气泡展开/折叠状态
const updateBubbleState = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const route = (currentPage as any)?.route || '';

  // 在聊天列表页展开，其他页面折叠
  const isInChatList = route === 'pages/chat/list';
  notificationStore.updateExpandState(isInChatList);
};

// 从后端获取系统配置并初始化 vConsole
const initSystemConfig = async () => {
  // #ifdef H5
  try {
    // 使用带缓存的配置获取，减少请求
    const config = await getPublicConfigWithCache();

    // 获取 debug.vconsole_enabled 配置
    const vConsoleEnabled = config?.debug?.vconsole_enabled ?? false;
    console.log('[App] vConsole 配置:', vConsoleEnabled);

    // 根据配置初始化 vConsole
    initVConsole(vConsoleEnabled);
  } catch (error) {
    console.error('[App] 获取系统配置失败:', error);

    // 配置获取失败时，开发环境默认开启，生产环境默认关闭
    const isDev = import.meta.env.DEV;
    console.log('[App] 使用默认 vConsole 配置:', isDev);
    initVConsole(isDev);
  }
  // #endif
};

onLaunch(() => {
  console.log('App Launch');

  // 初始化 authStore，从本地存储恢复数据
  const authStore = useAuthStore();
  authStore.init();

  // 应用启动时连接 WebSocket，保持全局在线
  if (authStore.token) {
    wsManager.connect();
  }

  // 初始化系统配置（包括 vConsole）
  initSystemConfig();

  console.log('Auth initialized, userInfo:', authStore.userInfo);
});

onShow(() => {
  console.log('App Show');
  // 应用回到前台时重连 WebSocket
  const authStore = useAuthStore();
  if (authStore.token && !wsManager.isConnected) {
    wsManager.connect();
  }

  // 更新气泡状态
  updateBubbleState();
});

onHide(() => {
  console.log('App Hide');
});

// 监听页面显示（页面切换时触发）
uni.$on('onPageShow', () => {
  updateBubbleState();
});
</script>

<template>
  <!-- NPS 全局弹窗 -->
  <NPSModal
    :visible="npsVisible"
    :trigger-type="npsTriggerType"
    :trigger-scene="npsTriggerScene"
    @close="closeNPS"
    @success="onNPSSuccess"
  />

  <!-- 消息气泡容器 -->
  <MessageBubbleContainer />
</template>

<style lang="scss">
@use '@/assets/styles/index.scss';

page {
  background-color: #f8f8f8;
  font-size: 28rpx;
  color: #333;
}

/* 防止内容不足一屏时出现滚动条 */
page,
body,
#app,
uni-page-body {
  height: 100%;
  overflow-y: auto;
}

/* 移除浏览器自动填充时的背景色 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
input:-internal-autofill-selected,
.uni-input-input:-webkit-autofill,
.uni-input-input:-webkit-autofill:hover,
.uni-input-input:-webkit-autofill:focus,
.uni-input-input:-webkit-autofill:active,
.uni-input-input:-internal-autofill-selected {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  box-shadow: 0 0 0 1000px #fff inset !important;
  -webkit-text-fill-color: #333 !important;
  background-color: #fff !important;
  background-image: none !important;
  caret-color: #333 !important;
}

/* 强制覆盖自动填充的过渡效果 */
input,
.uni-input-input {
  &:-webkit-autofill {
    -webkit-transition: background-color 0s 86400s, color 0s 86400s !important;
    transition: background-color 0s 86400s, color 0s 86400s !important;
  }

  &:-internal-autofill-selected {
    background-color: #fff !important;
    background-image: none !important;
    color: #333 !important;
  }
}

/* uni-app H5 端 input 包裹层 */
.uni-input-wrapper {
  background-color: transparent !important;
}

/* 强制覆盖 uni-input 组件的自动填充样式 */
uni-input input:-webkit-autofill,
uni-input input:-internal-autofill-selected {
  -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
  background-color: #fff !important;
}
</style>
