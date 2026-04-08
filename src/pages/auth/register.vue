<template>
  <view class="register-container">
    <view class="register-header">
      <text class="title">注册账号</text>
      <text class="subtitle">创建您的账号</text>
    </view>

    <view class="register-form">
      <view class="form-item">
        <text class="label">手机号</text>
        <input
          v-model="formData.mobile"
          class="input"
          type="number"
          placeholder="请输入手机号"
          maxlength="11"
        />
      </view>

      <view class="form-item">
        <text class="label">验证码</text>
        <view class="code-input">
          <input
            v-model="formData.code"
            class="input"
            type="number"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <button class="code-btn" :disabled="countdown > 0" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
      </view>

      <view class="form-item">
        <text class="label">密码</text>
        <input
          v-model="formData.password"
          class="input"
          type="password"
          placeholder="请输入密码"
          maxlength="20"
        />
      </view>

      <view class="form-item">
        <text class="label">昵称</text>
        <input
          v-model="formData.nickname"
          class="input"
          type="text"
          placeholder="请输入昵称"
          maxlength="20"
        />
      </view>

      <view class="form-item">
        <text class="label">性别</text>
        <view class="gender-options">
          <view
            :class="['gender-option', formData.gender === 1 ? 'active' : '']"
            @click="formData.gender = 1"
          >
            <text>男</text>
          </view>
          <view
            :class="['gender-option', formData.gender === 2 ? 'active' : '']"
            @click="formData.gender = 2"
          >
            <text>女</text>
          </view>
        </view>
      </view>

      <button class="register-btn" :disabled="loading" @click="handleRegister">
        {{ loading ? '注册中...' : '注册' }}
      </button>

      <view class="form-footer">
        <text class="link" @click="goToLogin">已有账号？去登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores'
import { authApi } from '@/api'
import { Gender } from '@/types/enums'
import { CryptoUtil } from '@/utils/crypto'

const authStore = useAuthStore()

const formData = ref({
  mobile: '',
  code: '',
  password: '',
  nickname: '',
  gender: Gender.UNKNOWN
})

const loading = ref(false)
const countdown = ref(0)

const sendCode = async () => {
  if (!formData.value.mobile) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none'
    })
    return
  }

  try {
    await authApi.sendSms({ mobile: formData.value.mobile, type: 'register' })
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    })

    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error: any) {
    console.error('Send code error:', error)
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none'
    })
  }
}

const handleRegister = async () => {
  if (!formData.value.mobile || !formData.value.code || !formData.value.password || !formData.value.nickname) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    })
    return
  }

  loading.value = true
  try {
    // 加密密码后再发送
    const encryptedPassword = CryptoUtil.encryptPassword(formData.value.password)
    await authStore.register({
      ...formData.value,
      password: encryptedPassword,
    })
    uni.showToast({
      title: '注册成功',
      icon: 'success'
    })
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/tabbar/home'
      })
    }, 1500)
  } catch (error: any) {
    console.error('Register error:', error)
    uni.showToast({
      title: error.message || '注册失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  padding: 80rpx 40rpx;
  background: #fff;

  .register-header {
    margin-bottom: 80rpx;

    .title {
      display: block;
      font-size: 48rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 16rpx;
    }

    .subtitle {
      display: block;
      font-size: 28rpx;
      color: #999;
    }
  }

  .register-form {
    .form-item {
      margin-bottom: 40rpx;

      .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
      }

      .input {
        width: 100%;
        height: 88rpx;
        padding: 0 24rpx;
        border: 2rpx solid #e0e0e0;
        border-radius: 12rpx;
        font-size: 28rpx;
        background: #f8f8f8;

        &:focus {
          border-color: #007aff;
          background: #fff;
        }
      }

      .code-input {
        display: flex;
        gap: 20rpx;

        .input {
          flex: 1;
        }

        .code-btn {
          width: 200rpx;
          height: 88rpx;
          line-height: 88rpx;
          background: #007aff;
          color: #fff;
          font-size: 24rpx;
          border-radius: 12rpx;
          border: none;
          padding: 0;

          &:disabled {
            opacity: 0.6;
          }
        }
      }

      .gender-options {
        display: flex;
        gap: 20rpx;

        .gender-option {
          flex: 1;
          height: 88rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2rpx solid #e0e0e0;
          border-radius: 12rpx;
          font-size: 28rpx;
          color: #666;
          background: #f8f8f8;

          &.active {
            border-color: #007aff;
            background: #007aff;
            color: #fff;
          }
        }
      }
    }

    .register-btn {
      width: 100%;
      height: 88rpx;
      line-height: 88rpx;
      background: #007aff;
      color: #fff;
      font-size: 32rpx;
      border-radius: 12rpx;
      border: none;
      margin-top: 40rpx;

      &:disabled {
        opacity: 0.6;
      }
    }

    .form-footer {
      display: flex;
      justify-content: center;
      margin-top: 40rpx;

      .link {
        font-size: 28rpx;
        color: #007aff;
      }
    }
  }
}
</style>