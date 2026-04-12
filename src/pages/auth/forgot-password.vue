<template>
  <view class="forgot-password-container">
    <view class="forgot-password-header">
      <text class="title">忘记密码</text>
      <text class="subtitle">通过手机号重置密码</text>
    </view>

    <view class="forgot-password-form">
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
          <text
            v-if="formData.mobile"
            class="clear-icon"
            @click="formData.mobile = ''"
          >
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
            <text
              v-if="formData.code"
              class="clear-icon"
              @click="formData.code = ''"
            >
              ✕
            </text>
          </view>
          <button class="code-btn" :disabled="countdown > 0" @click="sendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
      </view>

      <view class="form-item">
        <text class="label">新密码</text>
        <view class="password-input">
          <input
            v-model="formData.password"
            class="input"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入新密码（6-20位）"
            maxlength="20"
          />
          <text class="eye-icon" @click="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <view class="form-item">
        <text class="label">确认密码</text>
        <view class="password-input">
          <input
            v-model="formData.confirmPassword"
            class="input"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="请再次输入新密码"
            maxlength="20"
          />
          <text
            class="eye-icon"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
          </text>
        </view>
      </view>

      <button
        class="submit-btn"
        :disabled="loading"
        @click="handleResetPassword"
      >
        {{ loading ? '提交中...' : '重置密码' }}
      </button>

      <view class="form-footer">
        <text class="link" @click="goToLogin">返回登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '@/api';
import { CryptoUtil } from '@/utils/crypto';

const formData = ref({
  mobile: '',
  code: '',
  password: '',
  confirmPassword: '',
});

const loading = ref(false);
const countdown = ref(0);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const sendCode = async () => {
  if (!formData.value.mobile) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    });
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(formData.value.mobile)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    });
    return;
  }

  try {
    await authApi.sendSms({
      mobile: formData.value.mobile,
      type: 'reset_password',
    });
    uni.showToast({
      title: '验证码已发送',
      icon: 'success',
    });

    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error: any) {
    console.error('Send code error:', error);
    uni.showToast({
      title: error.message || '发送失败',
      icon: 'none',
    });
  }
};

const handleResetPassword = async () => {
  if (!formData.value.mobile) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    });
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(formData.value.mobile)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    });
    return;
  }

  if (!formData.value.code) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none',
    });
    return;
  }

  if (!formData.value.password) {
    uni.showToast({
      title: '请输入新密码',
      icon: 'none',
    });
    return;
  }

  if (formData.value.password.length < 6) {
    uni.showToast({
      title: '密码长度不能少于6位',
      icon: 'none',
    });
    return;
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    uni.showToast({
      title: '两次密码输入不一致',
      icon: 'none',
    });
    return;
  }

  loading.value = true;
  try {
    const encryptedPassword = CryptoUtil.encryptPassword(
      formData.value.password,
    );
    const result = await authApi.resetPassword({
      mobile: formData.value.mobile,
      code: formData.value.code,
      newPassword: encryptedPassword,
    });
    console.log(99, result);
    // if ()
    uni.showToast({
      title: '密码重置成功',
      icon: 'success',
    });
    setTimeout(() => {
      uni.redirectTo({
        url: '/pages/auth/login',
      });
    }, 1500);
  } catch (error: any) {
    console.error('Reset password error:', error);
    uni.showToast({
      title: error.message || '重置失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  uni.navigateBack();
};
</script>

<style scoped lang="scss">
.forgot-password-container {
  padding: 80rpx 40rpx;
  background: #fff;

  .forgot-password-header {
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

  .forgot-password-form {
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
    }

    .submit-btn {
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
