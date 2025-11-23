<template>
  <div class="register-page">
    <div class="register-header">
      <h1>创建账户</h1>
      <p>填写信息，完成注册</p>
    </div>

    <div class="register-form">
      <van-form @submit="onSubmit">
        <!-- 手机号 -->
        <van-field
          v-model="form.phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
          :rules="phoneRules"
        >
          <template #icon>
            <van-icon name="phone-o" />
          </template>
        </van-field>

        <!-- 验证码 -->
        <van-field
          v-model="form.code"
          center
          label="验证码"
          placeholder="请输入验证码"
          :rules="codeRules"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="!canSendCode"
              :loading="sendingCode"
              @click="sendCode"
            >
              {{ codeButtonText }}
            </van-button>
          </template>
        </van-field>

        <!-- 密码 -->
        <van-field
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="请输入密码（6-20位）"
          :rules="passwordRules"
        >
          <template #icon>
            <van-icon name="lock-o" />
          </template>
        </van-field>

        <!-- 确认密码 -->
        <van-field
          v-model="form.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
          :rules="confirmPasswordRules"
        >
          <template #icon>
            <van-icon name="lock-o" />
          </template>
        </van-field>

        <!-- 用户协议 -->
        <div class="agreement">
          <van-checkbox v-model="form.agree" shape="square">
            我已阅读并同意
            <span class="agreement-link" @click="showAgreement">《用户协议》</span>
            和
            <span class="agreement-link" @click="showPrivacy">《隐私政策》</span>
          </van-checkbox>
        </div>

        <!-- 注册按钮 -->
        <div class="submit-button">
          <van-button
            type="primary"
            block
            round
            native-type="submit"
            :loading="registering"
            :disabled="!form.agree"
          >
            {{ registering ? '注册中...' : '立即注册' }}
          </van-button>
        </div>

        <!-- 登录链接 -->
        <div class="login-link">
          已有账户？
          <span @click="goToLogin">立即登录</span>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import { useAuthStore } from '@/stores/auth'
  import type { User } from '@/types'

  const router = useRouter()
  const authStore = useAuthStore()

  // 表单数据
  const form = ref({
    phone: '',
    code: '',
    password: '',
    confirmPassword: '',
    agree: false
  })

  // 发送验证码相关
  const countdown = ref(0)
  const sendingCode = ref(false)
  const registering = ref(false)

  // 计算验证码按钮文本
  const codeButtonText = computed(() => {
    return countdown.value > 0 ? `${countdown.value}s后重试` : '获取验证码'
  })

  // 计算是否可以发送验证码
  const canSendCode = computed(() => {
    return /^1[3-9]\d{9}$/.test(form.value.phone) && countdown.value === 0
  })

  // 验证规则
  const phoneRules = [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
  ]

  const codeRules = [
    { required: true, message: '请输入验证码' },
    { pattern: /^\d{6}$/, message: '验证码格式不正确' }
  ]

  const passwordRules = [
    { required: true, message: '请输入密码' },
    { pattern: /^[a-zA-Z0-9]{6,20}$/, message: '密码格式不正确' }
  ]

  const confirmPasswordRules = [
    { required: true, message: '请确认密码' },
    {
      validator: () => {
        if (form.value.password !== form.value.confirmPassword) {
          return '两次密码输入不一致'
        }
        return true
      }
    }
  ]

  // 发送验证码
  const sendCode = async () => {
    if (!canSendCode.value) return

    try {
      sendingCode.value = true

      // 模拟发送验证码
      await new Promise(resolve => setTimeout(resolve, 1000))

      showToast('验证码已发送')
      countdown.value = 60

      // 开始倒计时
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } catch (error) {
      showToast('发送验证码失败')
    } finally {
      sendingCode.value = false
    }
  }

  // 提交注册
  const onSubmit = async () => {
    if (!form.value.agree) {
      showToast('请先同意用户协议')
      return
    }

    try {
      registering.value = true
      showLoadingToast({
        message: '注册中...',
        forbidClick: true,
        duration: 0
      })

      // 模拟注册API调用
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 模拟注册成功
      const userData: User = {
        id: 'user123',
        phone: form.value.phone,
        nickname: form.value.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        avatar: '',
        role: 'customer' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 更新用户状态
      authStore.setUser(userData)

      closeToast()
      showToast('注册成功')

      // 跳转到首页
      setTimeout(() => {
        router.push({ name: 'Home' })
      }, 1000)
    } catch (error) {
      closeToast()
      showToast('注册失败，请重试')
    } finally {
      registering.value = false
    }
  }

  // 显示用户协议
  const showAgreement = () => {
    showToast('用户协议页面')
  }

  // 显示隐私政策
  const showPrivacy = () => {
    showToast('隐私政策页面')
  }

  // 跳转到登录页
  const goToLogin = () => {
    router.push({ name: 'Login' })
  }

  // 监听路由参数
  onMounted(() => {
    const phone = router.currentRoute.value.query.phone as string
    if (phone) {
      form.value.phone = phone
    }
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .register-page {
    min-height: 100vh;
    background: $glass-bg-gradient;
    background-attachment: fixed;
    background-size: cover;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;

    .register-header {
      text-align: center;
      margin-bottom: 40px;
      color: white;

      h1 {
        font-size: 28px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      p {
        font-size: 16px;
        opacity: 0.8;
      }
    }

    .register-form {
      width: 100%;
      max-width: 400px;
      @include glassmorphism-card(strong);
      padding: 24px;

      .van-field {
        margin-bottom: 16px;
      }

      .agreement {
        margin: 24px 0;
        text-align: center;

        .agreement-link {
          color: #1989fa;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .submit-button {
        margin: 24px 0 32px;

        .van-button {
          height: 48px;
          font-size: 16px;
        }
      }

      .login-link {
        text-align: center;
        color: #666;
        font-size: 14px;

        span {
          color: #1989fa;
          font-weight: 500;
          cursor: pointer;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .register-page {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      background-attachment: fixed;
      background-size: cover;

      .register-header {
        color: white;
      }

      .register-form {
        @include glassmorphism-card(strong);
      }
    }
  }
</style>
