<template>
  <div class="server-error">
    <div class="server-error-container">
      <div class="server-error-icon">500</div>
      <h1 class="server-error-title">服务器错误</h1>
      <p class="server-error-description">抱歉，服务器出现了问题，请稍后重试或联系管理员。</p>
      <div class="server-error-details" v-if="errorDetails">
        <van-collapse v-model="activePanel">
          <van-collapse-item title="错误详���" name="details">
            <pre class="error-message">{{ errorDetails }}</pre>
          </van-collapse-item>
        </van-collapse>
      </div>
      <div class="server-error-actions">
        <van-button
          type="primary"
          size="large"
          @click="retry"
          class="server-error-button"
          :loading="isLoading"
        >
          {{ isLoading ? '重试中...' : '重试' }}
        </van-button>
        <van-button size="large" @click="goHome" class="server-error-button">返回首页</van-button>
      </div>
      <div class="server-error-tips">
        <p>💡 您可以：</p>
        <ul>
          <li>稍后刷新页面重试</li>
          <li>检查网络连接</li>
          <li>联系管理员反馈问题</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'

  const router = useRouter()
  const isLoading = ref(false)
  const activePanel = ref([])
  const errorDetails = ref('')

  // 模拟获取错误详情
  const fetchErrorDetails = () => {
    const error = new Error('服务器内部错误')
    error.stack = `TypeError: Cannot read property 'data' of undefined
    at axios.interceptors.response.fulfilled (services/api.ts:45)
    at fulfilled (axios.min.js:1)
    at runMicrotasks (<anonymous>)
    at processTicksAndRejections (internal/process/task_queues.js:93)
    at async fetchProducts (services/products.ts:12)`
    return error.stack
  }

  onMounted(() => {
    errorDetails.value = fetchErrorDetails()
  })

  const retry = async () => {
    try {
      isLoading.value = true
      showLoadingToast({
        message: '正在重试...',
        forbidClick: true
      })

      // 模拟重试请求
      await new Promise(resolve => setTimeout(resolve, 1500))

      closeToast()
      showToast('重试成功')

      // 刷新当前页面
      window.location.reload()
    } catch (error) {
      closeToast()
      isLoading.value = false
      showToast('重试失败，请稍后重试')
    }
  }

  const goHome = () => {
    router.push('/')
    showToast('正在返回首页')
  }
</script>

<style scoped lang="scss">
  .server-error {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
    padding: 20px;
  }

  .server-error-container {
    text-align: center;
    background: white;
    padding: 40px 30px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    }
  }

  .server-error-icon {
    font-size: 80px;
    font-weight: bold;
    color: var(--danger-color, #ee0a24);
    margin-bottom: 20px;
    background: linear-gradient(45deg, #ee0a24, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .server-error-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 16px;
  }

  .server-error-description {
    font-size: 16px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .server-error-details {
    margin-bottom: 32px;
    text-align: left;

    .error-message {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      color: #495057;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }
  }

  .server-error-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
  }

  .server-error-button {
    width: 100%;
    padding: 14px 20px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .server-error-tips {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    text-align: left;

    p {
      font-size: 14px;
      color: #495057;
      font-weight: 500;
      margin-bottom: 12px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        font-size: 13px;
        color: #6c757d;
        margin-bottom: 8px;
        padding-left: 16px;
        position: relative;

        &::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--primary-color, #1989fa);
          font-weight: bold;
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 480px) {
    .server-error-container {
      padding: 30px 20px;
      margin: 0 10px;
    }

    .server-error-icon {
      font-size: 60px;
    }

    .server-error-title {
      font-size: 20px;
    }

    .server-error-description {
      font-size: 14px;
    }

    .server-error-button {
      padding: 12px 16px;
      font-size: 14px;
    }

    .server-error-tips {
      padding: 16px;
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .server-error {
      background: linear-gradient(135deg, #2d1b1e 0%, #4a1f27 50%, #4a1f27 100%);
    }

    .server-error-container {
      background: #2a2a2a;
      border: 1px solid #404040;
    }

    .server-error-title {
      color: #ffffff;
    }

    .server-error-description {
      color: #cccccc;
    }

    .error-message {
      background: #1a1a1a;
      border-color: #404040;
      color: #cccccc;
    }

    .server-error-tips {
      background: #2a2a2a;

      p {
        color: #ffffff;
      }

      ul li {
        color: #aaaaaa;
      }
    }
  }

  // 动画效果
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }

  .server-error-icon {
    animation: shake 0.5s ease-in-out infinite;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .server-error-container {
    animation: fadeIn 0.6s ease-out;
  }
</style>
