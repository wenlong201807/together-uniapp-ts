<template>
  <view class="upload-demo">
    <view class="section">
      <view class="title">广场发消息（最多1张）</view>
      <ImageUploader
        v-model="squareImages"
        :max-count="1"
        :upload-type="UploadType.SQUARE"
        tip="最多上传1张图片，单张不超过5MB"
      />
    </view>

    <view class="section">
      <view class="title">个人相册（最多9张）</view>
      <ImageUploader
        v-model="albumImages"
        :max-count="9"
        :upload-type="UploadType.ALBUM"
        tip="最多上传9张图片，单张不超过5MB"
      />
    </view>

    <view class="section">
      <view class="title">头像上传</view>
      <ImageUploader
        v-model="avatarImages"
        :max-count="1"
        :upload-type="UploadType.AVATAR"
        tip="上传头像，单张不超过5MB"
      />
    </view>

    <view class="section">
      <view class="title">证件上传</view>
      <ImageUploader
        v-model="certificateImages"
        :max-count="2"
        :upload-type="UploadType.CERTIFICATE"
        tip="上传身份证正反面，单张不超过5MB"
      />
    </view>

    <view class="submit-btn" @click="handleSubmit">
      提交
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ImageUploader from '@/components/ImageUploader.vue';
import { UploadType } from '@/types/qiniu';

const squareImages = ref<string[]>([]);
const albumImages = ref<string[]>([]);
const avatarImages = ref<string[]>([]);
const certificateImages = ref<string[]>([]);

const handleSubmit = () => {
  console.log('广场图片:', squareImages.value);
  console.log('相册图片:', albumImages.value);
  console.log('头像:', avatarImages.value);
  console.log('证件:', certificateImages.value);

  uni.showToast({
    title: '提交成功',
    icon: 'success',
  });
};
</script>

<style scoped lang="scss">
.upload-demo {
  padding: 30rpx;

  .section {
    margin-bottom: 60rpx;

    .title {
      font-size: 32rpx;
      font-weight: bold;
      margin-bottom: 20rpx;
    }
  }

  .submit-btn {
    width: 100%;
    height: 88rpx;
    background: #007aff;
    color: #fff;
    font-size: 32rpx;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 60rpx;
  }
}
</style>
