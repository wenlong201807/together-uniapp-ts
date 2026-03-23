<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/stores';

onLaunch(() => {
  console.log('App Launch');

  const pinia = createPinia();
  const authStore = useAuthStore();
  authStore.init();
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
@use '@/assets/styles/index.scss';

page {
  background-color: #f8f8f8;
  font-size: 28rpx;
  color: #333;
}
</style>
