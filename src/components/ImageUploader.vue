<template>
  <view class="image-uploader">
    <view class="image-list">
      <view
        v-for="(item, index) in imageList"
        :key="index"
        class="image-item"
      >
        <image v-img-proxy="item.url" mode="aspectFill" class="image" />
        <view class="delete-btn" @click="handleDelete(index)">
          <text class="icon">×</text>
        </view>
        <view v-if="item.uploading" class="progress-mask">
          <text class="progress-text">{{ item.progress }}%</text>
        </view>
      </view>

      <view
        v-if="imageList.length < maxCount"
        class="upload-btn"
        @click="handleChooseImage"
      >
        <text class="icon">+</text>
        <text class="text">上传图片</text>
      </view>
    </view>

    <view v-if="tip" class="tip">{{ tip }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { qiniuService } from '@/services/qiniu.service';
import { UploadType } from '@/types/qiniu';

interface Props {
  modelValue: string[];
  maxCount?: number;
  uploadType: UploadType;
  tip?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void;
  (e: 'change', value: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 9,
  tip: '',
});

const emit = defineEmits<Emits>();

interface ImageItem {
  url: string;
  uploading: boolean;
  progress: number;
}

const imageList = ref<ImageItem[]>([]);

// 初始化图片列表
const initImageList = () => {
  imageList.value = props.modelValue.map(url => ({
    url,
    uploading: false,
    progress: 100,
  }));
};

// 监听 modelValue 变化
watch(() => props.modelValue, () => {
  initImageList();
}, { immediate: true });

const handleChooseImage = () => {
  const count = props.maxCount - imageList.value.length;

  uni.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths;

      for (const filePath of tempFilePaths) {
        const item: ImageItem = {
          url: filePath,
          uploading: true,
          progress: 0,
        };
        imageList.value.push(item);

        try {
          const result = await qiniuService.uploadImage(
            filePath,
            props.uploadType,
            (progress) => {
              item.progress = Math.floor(progress.percent);
            }
          );

          item.url = result.url;
          item.uploading = false;
          item.progress = 100;

          await qiniuService.saveFileRecord(
            result.key,
            props.uploadType,
            filePath.split('/').pop()
          );

          updateValue();
        } catch (error) {
          console.error('上传失败', error);
          uni.showToast({
            title: '上传失败',
            icon: 'none',
          });

          const index = imageList.value.indexOf(item);
          if (index > -1) {
            imageList.value.splice(index, 1);
          }
        }
      }
    },
  });
};

const handleDelete = (index: number) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        imageList.value.splice(index, 1);
        updateValue();
      }
    },
  });
};

const updateValue = () => {
  const urls = imageList.value
    .filter(item => !item.uploading)
    .map(item => item.url);
  emit('update:modelValue', urls);
  emit('change', urls);
};
</script>

<style scoped lang="scss">
.image-uploader {
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
  }

  .image-item {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    border-radius: 8rpx;
    overflow: hidden;

    .image {
      width: 100%;
      height: 100%;
    }

    .delete-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 40rpx;
      height: 40rpx;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        color: #fff;
        font-size: 32rpx;
        line-height: 1;
      }
    }

    .progress-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;

      .progress-text {
        color: #fff;
        font-size: 24rpx;
      }
    }
  }

  .upload-btn {
    width: 200rpx;
    height: 200rpx;
    border: 2rpx dashed #ddd;
    border-radius: 8rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fafafa;

    .icon {
      font-size: 60rpx;
      color: #999;
      line-height: 1;
    }

    .text {
      font-size: 24rpx;
      color: #999;
      margin-top: 10rpx;
    }
  }

  .tip {
    font-size: 24rpx;
    color: #999;
    margin-top: 20rpx;
  }
}
</style>
