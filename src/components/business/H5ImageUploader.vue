<template>
  <!-- 无UI逻辑组件 -->
</template>

<script setup lang="ts">
// #ifdef H5
import { h5ChooseImage } from '@/utils/h5-image-picker'
import type { H5ImageResult } from '@/utils/h5-image-picker'
// #endif

interface Props {
  maxCount?: number      // 最多上传数量
  maxSize?: number       // 最大文件大小（MB）
  quality?: number       // 压缩质量 0-1
  maxWidth?: number      // 最大宽度
  maxHeight?: number     // 最大高度
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 20,  // 与业务需求一致
  maxSize: 10,
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
})

const emit = defineEmits<{
  change: [files: File[]]           // 文件选择变化
}>()

// #ifdef H5
// 从相册选择
const chooseFromAlbum = async () => {
  console.log('[H5ImageUploader] 从相册选择')

  try {
    const result: H5ImageResult = await h5ChooseImage({
      count: props.maxCount,
      sourceType: ['album'],
      sizeType: ['compressed'],
      maxSize: props.maxSize,
      quality: props.quality,
      maxWidth: props.maxWidth,
      maxHeight: props.maxHeight,
    })

    console.log('[H5ImageUploader] 选择成功，文件数量:', result.tempFiles.length)
    emit('change', result.tempFiles)
  } catch (error: any) {
    console.error('[H5ImageUploader] 选择失败:', error)
    if (error.message !== '用户取消选择') {
      uni.showToast({
        title: error.message || '选择失败',
        icon: 'none',
      })
    }
  }
}

// 拍照
const chooseFromCamera = async () => {
  console.log('[H5ImageUploader] 拍照')

  try {
    const result: H5ImageResult = await h5ChooseImage({
      count: 1,
      sourceType: ['camera'],
      sizeType: ['compressed'],
      maxSize: props.maxSize,
      quality: props.quality,
      maxWidth: props.maxWidth,
      maxHeight: props.maxHeight,
    })

    console.log('[H5ImageUploader] 拍照成功')
    emit('change', result.tempFiles)
  } catch (error: any) {
    console.error('[H5ImageUploader] 拍照失败:', error)
    if (error.message !== '用户取消选择') {
      uni.showToast({
        title: error.message || '拍照失败',
        icon: 'none',
      })
    }
  }
}
// #endif

// 暴露方法给父组件
defineExpose({
  chooseFromAlbum,
  chooseFromCamera,
})
</script>

<style scoped lang="scss">
// 无UI样式
</style>
