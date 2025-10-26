<template>
  <div class="webview-token-example">
    <div class="header">
      <h2>WebView Token 通讯示例</h2>
      <p class="description">演示 Vue 应用与微信小程序之间的 token 传递</p>
    </div>

    <div class="status-section">
      <div class="status-item">
        <span class="label">WebView Bridge 状态:</span>
        <span :class="['status', { ready: isReady, 'not-ready': !isReady }]">
          {{ isReady ? '✅ 已就绪' : '⏳ 初始化中...' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">运行环境:</span>
        <span class="status">{{ isInMiniProgram ? '📱 微信小程序' : '🌐 普通浏览器' }}</span>
      </div>
      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>
    </div>

    <div class="token-section">
      <h3>Token 管理</h3>

      <div class="current-token" v-if="authStore.token">
        <div class="token-info">
          <span class="label">当前 Token:</span>
          <span class="token-value">{{ maskToken(authStore.token) }}</span>
        </div>
        <div class="user-info" v-if="authStore.user">
          <span class="label">用户信息:</span>
          <span class="user-value">{{ authStore.user.nickname || authStore.user.phone || '未知用户' }}</span>
        </div>
      </div>

      <div class="no-token" v-else>
        <span class="placeholder">暂无 Token</span>
      </div>

      <div class="action-buttons">
        <button
          @click="handleGetToken"
          :disabled="loading"
          class="btn primary"
        >
          <span v-if="loading">⏳ 获取中...</span>
          <span v-else>🔐 从小程序获取 Token</span>
        </button>

        <button
          @click="handleLogin"
          :disabled="loading"
          class="btn secondary"
        >
          <span v-if="loading">⏳ 登录中...</span>
          <span v-else>🔑 微信登录</span>
        </button>

        <button
          @click="handleGetUserInfo"
          :disabled="loading || !authStore.token"
          class="btn info"
        >
          <span v-if="loading">⏳ 获取中...</span>
          <span v-else>👤 获取用户信息</span>
        </button>

        <button
          @click="handleClearToken"
          class="btn danger"
        >
          🗑️ 清除 Token
        </button>
      </div>
    </div>

    <div class="communication-section">
      <h3>通讯测试</h3>

      <div class="message-section">
        <div class="input-group">
          <label>发送消息到小程序:</label>
          <input
            v-model="messageInput"
            type="text"
            placeholder="输入消息内容"
            @keyup.enter="handleSendMessage"
          />
          <button @click="handleSendMessage" class="btn small">发送</button>
        </div>

        <div class="received-messages">
          <h4>接收到的消息:</h4>
          <div class="message-list">
            <div
              v-for="(msg, index) in receivedMessages"
              :key="index"
              class="message-item"
            >
              <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
              <span class="type">[{{ msg.type }}]</span>
              <span class="content">{{ JSON.stringify(msg.data) }}</span>
            </div>
            <div v-if="receivedMessages.length === 0" class="no-messages">
              暂无消息
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="debug-section" v-if="debugMode">
      <h3>调试信息</h3>
      <button @click="debugMode = !debugMode" class="btn small toggle">
        {{ debugMode ? '隐藏' : '显示' }}调试信息
      </button>

      <div v-if="debugMode" class="debug-content">
        <pre>{{ JSON.stringify(debugInfo, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWebViewBridge } from '@/composables/useWebViewBridge'

// 状态管理
const authStore = useAuthStore()
const { isReady, isInMiniProgram, error, getMallToken, login, getUserInfo, on, off } = useWebViewBridge({
  debug: true,
  autoInit: true
})

// 组件状态
const loading = ref(false)
const messageInput = ref('')
const receivedMessages = ref<Array<{ type: string; data: any; timestamp: number }>>([])
const debugMode = ref(false)
const debugInfo = reactive({
  vueToken: '',
  storeToken: '',
  bridgeStatus: '',
  lastAction: '',
  messagesCount: 0
})

// 处理从小程序获取 Token
const handleGetToken = async () => {
  if (loading.value) return

  loading.value = true
  debugInfo.lastAction = 'getMallToken'

  try {
    console.log('🔐 开始从小程序获取 Token...')

    const result = await getMallToken()

    if (result && result.token) {
      // 保存认证信息到 Pinia store
      authStore.token = result.token
      if (result.user) {
        authStore.user = result.user
      }

      debugInfo.vueToken = result.token.substring(0, 20) + '...'
      debugInfo.storeToken = authStore.token.substring(0, 20) + '...'

      showToast('✅ Token 获取成功', 'success')
      console.log('✅ Token 获取成功:', result)
    } else {
      showToast('❌ Token 获取失败: 无效响应', 'error')
      console.warn('⚠️ Token 获取失败: 无效响应', result)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '获取 Token 失败'
    showToast(`❌ ${errorMsg}`, 'error')
    console.error('❌ Token 获取失败:', err)
  } finally {
    loading.value = false
  }
}

// 处理微信登录
const handleLogin = async () => {
  if (loading.value) return

  loading.value = true
  debugInfo.lastAction = 'login'

  try {
    console.log('🔑 开始微信登录...')

    const result = await login()

    if (result && result.token) {
      // 保存认证信息到 Pinia store
      authStore.token = result.token
      if (result.userInfo) {
        authStore.user = result.userInfo
      }

      debugInfo.vueToken = result.token.substring(0, 20) + '...'
      debugInfo.storeToken = authStore.token.substring(0, 20) + '...'

      showToast('✅ 登录成功', 'success')
      console.log('✅ 登录成功:', result)
    } else {
      showToast('❌ 登录失败: 无效响应', 'error')
      console.warn('⚠️ 登录失败: 无效响应', result)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '登录失败'
    showToast(`❌ ${errorMsg}`, 'error')
    console.error('❌ 登录失败:', err)
  } finally {
    loading.value = false
  }
}

// 处理获取用户信息
const handleGetUserInfo = async () => {
  if (loading.value) return

  loading.value = true
  debugInfo.lastAction = 'getUserInfo'

  try {
    console.log('👤 开始获取用户信息...')

    const result = await getUserInfo()

    if (result) {
      // 更新用户信息到 Pinia store
      authStore.user = result

      showToast('✅ 用户信息获取成功', 'success')
      console.log('✅ 用户信息获取成功:', result)
    } else {
      showToast('❌ 用户信息获取失败: 无效响应', 'error')
      console.warn('⚠️ 用户信息获取失败: 无效响应', result)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '获取用户信息失败'
    showToast(`❌ ${errorMsg}`, 'error')
    console.error('❌ 用户信息获取失败:', err)
  } finally {
    loading.value = false
  }
}

// 清除 Token
const handleClearToken = () => {
  authStore.clearAuth()
  debugInfo.vueToken = ''
  debugInfo.storeToken = ''
  showToast('✅ Token 已清除', 'success')
  console.log('✅ Token 已清除')
}

// 发送消息到小程序
const handleSendMessage = () => {
  if (!messageInput.value.trim()) return

  // 这里可以添加发送消息到小程序的逻辑
  console.log('📤 发送消息到小程序:', messageInput.value)

  // 模拟发送
  setTimeout(() => {
    receivedMessages.value.unshift({
      type: 'echo',
      data: { message: messageInput.value, status: 'received' },
      timestamp: Date.now()
    })
    debugInfo.messagesCount = receivedMessages.value.length
    messageInput.value = ''
  }, 500)
}

// 显示 Toast (简化版)
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`🍞 Toast [${type}]: ${message}`)
  // 这里可以集成实际的 Toast 组件
}

// 工具函数：遮蔽 Token
const maskToken = (token: string) => {
  if (!token) return ''
  return token.substring(0, 10) + '...' + token.substring(token.length - 10)
}

// 工具函数：格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 🔥 自动获取 mall_token 的函数
const autoGetMallToken = async () => {
  console.log('🔐 ========== 开始自动获取 mall_token ==========')

  try {
    // 1. 优��检查 URL 参数中的 token
    console.log('🔍 检查 URL 参数中的 token...')
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('mall_token')
    const urlUserId = urlParams.get('user_id')

    if (urlToken) {
      console.log('✅ 从 URL 参数中发现 token:', maskToken(urlToken))

      // 保存认证信息到 Pinia store
      authStore.token = urlToken

      // 如果有用户ID，保存用户信息
      if (urlUserId) {
        authStore.user = {
          id: parseInt(urlUserId),
          nickname: '通过URL传入的用户',
          phone: ''
        }
      }

      debugInfo.vueToken = urlToken.substring(0, 20) + '...'
      debugInfo.storeToken = authStore.token.substring(0, 20) + '...'

      console.log('🎉 ========== URL 参数 mall_token 获取成功 ==========')
      console.log('🔑 Token:', maskToken(urlToken))
      console.log('👤 用户ID:', urlUserId || '无')
      console.log('📖 来源: URL 参数传递')
      console.log('⏰ 获取时间:', new Date().toLocaleTimeString())
      console.log('================================================')

      // 显示成功提示
      showToast('🎉 从 URL 参数获取 Token 成功！', 'success')

      // 记录成功消息
      receivedMessages.value.unshift({
        type: 'urlTokenSuccess',
        data: {
          message: 'URL 参数 mall_token 获取成功',
          token: maskToken(urlToken),
          userId: urlUserId,
          source: 'URL参数',
          timestamp: Date.now()
        },
        timestamp: Date.now()
      })

      // 清理 URL 参数（可选）
      cleanURLParams()
      return
    }

    // 2. 如果 URL 中没有 token，再通过 postMessage 获取
    console.log('📡 URL 中没有 token，通过 postMessage 向小程序请求...')

    // 如果已经有 token，就不重复获取
    if (authStore.token) {
      console.log('✅ Store 中已有 token，跳过 postMessage 获取:', maskToken(authStore.token))
      return
    }

    console.log('📡 正在通过 postMessage 从小程序获取 mall_token...')
    const result = await getMallToken()

    if (result && result.token) {
      // 保存认证信息到 Pinia store
      authStore.token = result.token
      if (result.user) {
        authStore.user = result.user
      }

      debugInfo.vueToken = result.token.substring(0, 20) + '...'
      debugInfo.storeToken = authStore.token.substring(0, 20) + '...'

      console.log('🎉 ========== postMessage mall_token 获取成功 ==========')
      console.log('🔑 Token:', maskToken(result.token))
      console.log('👤 用户:', result.user?.nickname || result.user?.phone || '未知用户')
      console.log('📱 用户ID:', result.user?.id || '无')
      console.log('📖 来源: postMessage 通讯')
      console.log('⏰ 获取时间:', new Date().toLocaleTimeString())
      console.log('================================================')

      // 显示成功提示
      showToast('🎉 postMessage Token 获取成功！', 'success')

      // 记录成功消息
      receivedMessages.value.unshift({
        type: 'postMessageTokenSuccess',
        data: {
          message: 'postMessage mall_token 获取成功',
          token: maskToken(result.token),
          user: result.user?.nickname || '未知用户',
          source: 'postMessage',
          timestamp: Date.now()
        },
        timestamp: Date.now()
      })
    } else {
      throw new Error('postMessage 返回的数据无效')
    }
  } catch (err) {
    console.log('❌ ========== mall_token 自动获取失败 ==========')
    console.log('🚨 错误信息:', err instanceof Error ? err.message : String(err))
    console.log('⏰ 失败时间:', new Date().toLocaleTimeString())
    console.log('💡 建议检查小程序登录状态或手动点击获取按钮')
    console.log('================================================')

    // 显示失败提示
    showToast(`❌ Token 自动获取失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error')

    // 记录失败消息
    receivedMessages.value.unshift({
      type: 'autoTokenError',
      data: {
        message: 'mall_token 自动获取失败',
        error: err instanceof Error ? err.message : String(err),
        timestamp: Date.now()
      },
      timestamp: Date.now()
    })

    debugInfo.lastAction = 'autoGetMallTokenFailed'
  }
}

// 清理 URL 参数
const cleanURLParams = () => {
  try {
    const url = new URL(window.location.href)
    const params = url.searchParams

    // 删除敏感参数
    params.delete('mall_token')
    params.delete('user_id')
    params.delete('timestamp')

    // 更新 URL，不产生历史记录
    window.history.replaceState({}, '', url.toString())

    console.log('🧹 URL 参数已清理')
  } catch (error) {
    console.warn('清理 URL 参数失败:', error)
  }
}

// 组件挂载时设置消息监听和自动获取 Token
onMounted(async () => {
  console.log('🚀 WebView Token Example 组件已挂载')

  // 监听来自小程序的各种消息
  on('auth', (data) => {
    console.log('📨 收到认证消息:', data)
    receivedMessages.value.unshift({
      type: 'auth',
      data,
      timestamp: Date.now()
    })
    debugInfo.messagesCount = receivedMessages.value.length
  })

  on('loginResult', (data) => {
    console.log('📨 收到登录结果:', data)
    receivedMessages.value.unshift({
      type: 'loginResult',
      data,
      timestamp: Date.now()
    })
    debugInfo.messagesCount = receivedMessages.value.length
  })

  on('getMallTokenResult', (data) => {
    console.log('📨 收到 Token 结果:', data)
    receivedMessages.value.unshift({
      type: 'getMallTokenResult',
      data,
      timestamp: Date.now()
    })
    debugInfo.messagesCount = receivedMessages.value.length
  })

  // 🔥 页面加载完成后自动获取 mall_token
  setTimeout(async () => {
    if (isReady.value && isInMiniProgram.value) {
      console.log('🎯 页面加载完成，开始自动获取 mall_token...')
      await autoGetMallToken()
    } else {
      console.log('⏳ WebView Bridge 未就绪，等待就绪后再获取 token...')
      // 监听就绪状态变化
      const checkReady = setInterval(() => {
        if (isReady.value) {
          clearInterval(checkReady)
          console.log('🎯 WebView Bridge 已就绪，开始自动获取 mall_token...')
          autoGetMallToken()
        }
      }, 500)

      // 10秒后停止检查
      setTimeout(() => clearInterval(checkReady), 10000)
    }
  }, 1000) // 延迟1秒确保页面完全加载

  // 更新调试信息
  const updateDebugInfo = () => {
    debugInfo.bridgeStatus = isReady.value ? 'ready' : 'not-ready'
    debugInfo.vueToken = authStore.token ? authStore.token.substring(0, 20) + '...' : ''
    debugInfo.storeToken = authStore.token ? authStore.token.substring(0, 20) + '...' : ''
  }

  // 定期更新调试信息
  const interval = setInterval(updateDebugInfo, 1000)

  // 组件卸载���清理
  onUnmounted(() => {
    clearInterval(interval)
    off('auth')
    off('loginResult')
    off('getMallTokenResult')
  })
})
</script>

<style scoped>
.webview-token-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #333;
  margin-bottom: 10px;
}

.description {
  color: #666;
  font-size: 14px;
}

.status-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-item .label {
  font-weight: 600;
  color: #333;
}

.status.ready {
  color: #28a745;
  font-weight: 600;
}

.status.not-ready {
  color: #ffc107;
  font-weight: 600;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.token-section {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.token-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.current-token {
  background: #e7f3ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.token-info, .user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.token-info .label, .user-info .label {
  font-weight: 600;
  color: #333;
}

.token-value, .user-value {
  font-family: monospace;
  color: #0066cc;
}

.no-token {
  text-align: center;
  color: #999;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn.info {
  background: #17a2b8;
  color: white;
}

.btn.info:hover:not(:disabled) {
  background: #138496;
}

.btn.danger {
  background: #dc3545;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: #c82333;
}

.btn.small {
  padding: 8px 16px;
  font-size: 12px;
}

.communication-section {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.communication-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.input-group label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #333;
  min-width: 150px;
}

.input-group input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.received-messages h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.message-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.message-item {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f1f3f4;
  font-size: 12px;
}

.message-item:last-child {
  border-bottom: none;
}

.timestamp {
  color: #999;
  min-width: 80px;
}

.type {
  color: #007bff;
  font-weight: 600;
  min-width: 120px;
}

.content {
  color: #333;
  word-break: break-all;
}

.no-messages {
  text-align: center;
  color: #999;
  padding: 20px;
}

.debug-section {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
}

.debug-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.toggle {
  margin-bottom: 15px;
}

.debug-content {
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 15px;
}

.debug-content pre {
  margin: 0;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .webview-token-example {
    padding: 10px;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }

  .input-group {
    flex-direction: column;
  }

  .input-group label {
    min-width: auto;
    margin-bottom: 5px;
  }

  .message-item {
    flex-direction: column;
    gap: 5px;
  }

  .timestamp, .type {
    min-width: auto;
  }
}
</style>