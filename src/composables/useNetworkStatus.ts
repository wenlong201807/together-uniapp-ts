import { ref, onMounted, onUnmounted } from 'vue';

export const useNetworkStatus = () => {
  const isOnline = ref(true);
  const networkType = ref('');

  const checkNetworkStatus = () => {
    uni.getNetworkType({
      success: (res) => {
        isOnline.value = res.networkType !== 'none';
        networkType.value = res.networkType;
      },
    });
  };

  const handleNetworkChange = (res: any) => {
    isOnline.value = res.networkType !== 'none';
    networkType.value = res.networkType;

    if (!isOnline.value) {
      uni.showToast({
        title: '网络已断开',
        icon: 'none',
        duration: 2000,
      });
    } else {
      uni.showToast({
        title: '网络已连接',
        icon: 'success',
        duration: 1500,
      });
    }
  };

  const checkBeforeAction = (actionName: string = '操作'): boolean => {
    if (!isOnline.value) {
      uni.showToast({
        title: `网络未连接，无法${actionName}`,
        icon: 'none',
        duration: 2000,
      });
      return false;
    }
    return true;
  };

  onMounted(() => {
    checkNetworkStatus();
    uni.onNetworkStatusChange(handleNetworkChange);
  });

  onUnmounted(() => {
    uni.offNetworkStatusChange(handleNetworkChange);
  });

  return {
    isOnline,
    networkType,
    checkBeforeAction,
  };
};
