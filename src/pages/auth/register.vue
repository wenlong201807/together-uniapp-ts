<template>
  <view class="register-container">
    <view class="register-header">
      <text class="title">注册账号</text>
      <text class="subtitle">创建您的账号</text>
    </view>

    <view class="register-form">
      <view class="form-item">
        <text class="label">手机号</text>
        <view class="input-wrapper">
          <input
            v-model="formData.mobile"
            class="input"
            type="number"
            placeholder="请输入手机号"
            maxlength="11"
          />
          <text v-if="formData.mobile" class="clear-icon" @click="formData.mobile = ''">
            ✕
          </text>
        </view>
      </view>

      <view class="form-item">
        <text class="label">邮箱</text>
        <view class="input-wrapper">
          <input
            v-model="formData.email"
            class="input"
            type="text"
            placeholder="请输入邮箱"
          />
          <text v-if="formData.email" class="clear-icon" @click="formData.email = ''">
            ✕
          </text>
        </view>
      </view>

      <view class="form-item">
        <text class="label">验证码</text>
        <view class="code-input">
          <view class="input-wrapper">
            <input
              v-model="formData.code"
              class="input"
              type="number"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <text v-if="formData.code" class="clear-icon" @click="formData.code = ''">
              ✕
            </text>
          </view>
          <button class="code-btn" :disabled="countdown > 0" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
        <view class="form-tip">
          <text class="tip-text">💡 验证码将发送到您的邮箱</text>
        </view>
      </view>

      <view class="form-item">
        <text class="label">密码</text>
        <view class="password-input">
          <input
            v-model="formData.password"
            class="input"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            maxlength="20"
          />
          <text class="eye-icon" @click="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <view class="form-item">
        <text class="label">昵称</text>
        <view class="input-wrapper">
          <input
            v-model="formData.nickname"
            class="input"
            type="text"
            placeholder="请输入昵称"
            maxlength="20"
          />
          <text v-if="formData.nickname" class="clear-icon" @click="formData.nickname = ''">
            ✕
          </text>
        </view>
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

      <view class="form-item">
        <text class="label">邀请码（选填）</text>
        <view class="input-wrapper">
          <input
            v-model="formData.inviteCode"
            class="input"
            type="text"
            placeholder="请输入邀请码"
            maxlength="20"
          />
          <text v-if="formData.inviteCode" class="clear-icon" @click="formData.inviteCode = ''">
            ✕
          </text>
        </view>
      </view>

      <view v-if="formData.inviteCode" class="invite-tip">
        <text class="tip-icon">🎁</text>
        <text class="tip-text">使用邀请码注册，您和邀请人都将获得积分奖励</text>
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores'
import { authApi } from '@/api'
import { Gender } from '@/types/enums'
import { CryptoUtil } from '@/utils/crypto'

const authStore = useAuthStore()

const formData = ref({
  mobile: '',
  email: '',
  code: '',
  password: '',
  nickname: '',
  gender: Gender.UNKNOWN,
  inviteCode: '' // 邀请码
})

const loading = ref(false)
const countdown = ref(0)
const showPassword = ref(false)

// 页面加载时获取 URL 参数中的邀请码
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.inviteCode) {
    formData.value.inviteCode = options.inviteCode
    console.log('获取到邀请码:', options.inviteCode)
  }
})

const sendCode = async () => {
  if (!formData.value.mobile) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none'
    })
    return
  }

  if (!formData.value.email) {
    uni.showToast({
      title: '请输入邮箱',
      icon: 'none'
    })
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    uni.showToast({
      title: '请输入正确的邮箱格式',
      icon: 'none'
    })
    return
  }

  try {
    await authApi.sendSms({
      mobile: formData.value.mobile,
      email: formData.value.email,
      type: 'register'
    })
    uni.showToast({
      title: '验证码已发送到邮箱',
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
  if (!formData.value.mobile || !formData.value.email || !formData.value.code || !formData.value.password || !formData.value.nickname) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    })
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    uni.showToast({
      title: '请输入正确的邮箱格式',
      icon: 'none'
    })
    return
  }

  loading.value = true
  try {
    // 加密密码后再发送
    const encryptedPassword = CryptoUtil.encryptPassword(formData.value.password)

    // 构建注册数据，确保 inviteCode 被传递
    const registerData = {
      mobile: formData.value.mobile,
      email: formData.value.email,
      code: formData.value.code,
      password: encryptedPassword,
      nickname: formData.value.nickname,
      gender: formData.value.gender,
      inviteCode: formData.value.inviteCode || undefined, // 如果有邀请码则传递
    }

    console.log('注册数据:', registerData)

    await authStore.register(registerData)

    // 显示注册成功提示
    if (formData.value.inviteCode) {
      uni.showToast({
        title: '注册成功！已获得邀请奖励',
        icon: 'success',
        duration: 2000
      })
    } else {
      uni.showToast({
        title: '注册成功',
        icon: 'success'
      })
    }

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
  uni.navigateTo({
    url: '/pages/auth/login'
  })
}
</script>

<style scoped lang="scss">
.register-container {
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
        background: #fff;

        &:focus {
          border-color: #007aff;
        }
      }

      .input-wrapper,
      .password-input {
        position: relative;
        display: flex;
        align-items: center;

        .input {
          flex: 1;
          padding-right: 80rpx;
        }

        .clear-icon,
        .eye-icon {
          position: absolute;
          right: 24rpx;
          width: 40rpx;
          height: 40rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32rpx;
          color: #999;
          cursor: pointer;
          user-select: none;
        }

        .eye-icon {
          font-size: 36rpx;
        }
      }

      .code-input {
        display: flex;
        gap: 20rpx;

        .input-wrapper {
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
          background: #fff;

          &.active {
            border-color: #007aff;
            background: #007aff;
            color: #fff;
          }
        }
      }
    }

    .form-tip {
      margin-top: 12rpx;
      padding-left: 4rpx;

      .tip-text {
        font-size: 24rpx;
        color: #ff9800;
        line-height: 1.5;
      }
    }

    .invite-tip {
      display: flex;
      align-items: center;
      padding: 24rpx;
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      border-radius: 12rpx;
      margin-bottom: 40rpx;
      border: 2rpx solid #ffcccc;

      .tip-icon {
        font-size: 32rpx;
        margin-right: 16rpx;
      }

      .tip-text {
        flex: 1;
        font-size: 24rpx;
        color: #ff6b6b;
        line-height: 1.5;
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