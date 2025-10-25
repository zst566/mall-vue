<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>用户登录</h1>
        <p>欢迎回到滨江宏岸商场</p>
      </div>

      <van-form @submit="onSubmit">
        <div class="login-form">
          <van-field
            v-model="loginForm.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
          />
          <van-field
            v-model="loginForm.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />

          <div class="login-options">
            <van-checkbox v-model="rememberMe">记住我</van-checkbox>
            <span class="forgot-password" @click="forgotPassword">忘记密码？</span>
          </div>

          <van-button type="primary" block native-type="submit" :loading="loading">
            {{ loading ? '登录中...' : '登录' }}
          </van-button>

          <div class="other-login">
            <div class="divider">
              <span>其他登录方式</span>
            </div>
            <div class="social-login">
              <van-button round icon="wechat" @click="wechatLogin">微信登录</van-button>
            </div>
          </div>
        </div>
      </van-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="register-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showLoadingToast } from 'vant'

  const router = useRouter()

  // 表单数据
  const loginForm = ref({
    username: '',
    password: ''
  })

  const rememberMe = ref(false)
  const loading = ref(false)

  // 表单提交
  const onSubmit = async (values: any) => {
    loading.value = true

    try {
      showLoadingToast({
        message: '登录中...',
        forbidClick: true,
        duration: 0
      })

      // 模拟登录请求
      setTimeout(() => {
        showToast('登录成功')

        // 保存登录状态
        localStorage.setItem('token', 'mock-token-' + Date.now())
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: '1',
            username: values.username,
            nickname: '用户' + values.username,
            role: 'customer'
          })
        )

        // 跳转到首页
        router.push({ name: 'Home' })
      }, 1500)
    } catch (error) {
      showToast({
        message: '登录失败',
        type: 'fail'
      })
    } finally {
      loading.value = false
    }
  }

  // 忘记密码
  const forgotPassword = () => {
    showToast('联系客服找回密码')
  }

  // 微��登录
  const wechatLogin = () => {
    showToast('正在跳转到微信登录...')
    // 这里应该调用微信登录接口
  }
</script>

<style lang="scss" scoped>
  .login-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .login-container {
    width: 100%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: var(--van-radius-lg);
    padding: 40px 30px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

    .login-header {
      text-align: center;
      margin-bottom: 40px;

      h1 {
        font-size: 28px;
        font-weight: 600;
        color: var(--van-text-color);
        margin: 0 0 8px 0;
      }

      p {
        font-size: 16px;
        color: var(--van-text-color-3);
        margin: 0;
      }
    }

    .login-form {
      .login-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;

        .forgot-password {
          font-size: 14px;
          color: var(--van-primary-color);
          cursor: pointer;

          &:hover {
            opacity: 0.8;
          }
        }
      }

      .other-login {
        margin-top: 32px;

        .divider {
          text-align: center;
          margin-bottom: 20px;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--van-border-color);
          }

          span {
            position: relative;
            background: rgba(255, 255, 255, 0.95);
            padding: 0 16px;
            font-size: 14px;
            color: var(--van-text-color-3);
          }
        }

        .social-login {
          display: flex;
          justify-content: center;

          .van-button {
            width: 100%;
            height: 44px;
            background: #07c160;
            border: none;
            color: white;

            &:hover {
              background: #06ad56;
            }
          }
        }
      }
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: var(--van-text-color-3);

      .register-link {
        color: var(--van-primary-color);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .login-page {
      background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
    }

    .login-container {
      background: rgba(45, 55, 72, 0.95);

      .login-header h1 {
        color: #fff;
      }

      .login-header p {
        color: #cbd5e0;
      }

      .other-login .divider span {
        background: rgba(45, 55, 72, 0.95);
      }
    }
  }
</style>
