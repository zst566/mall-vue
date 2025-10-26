<template>
  <div class="bridge-login-test">
    <div class="container">
      <h1>WebView Bridge 登录测试</h1>

      <div class="status-section">
        <div class="status-item">
          <span class="label">环境检测:</span>
          <span :class="['badge', isInMiniProgram ? 'success' : 'warning']">
            {{ isInMiniProgram ? '📱 微信小程序环境' : '🌐 普通浏览器环境' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">Bridge 状态:</span>
          <span :class="['badge', isReady ? 'success' : 'danger']">
            {{ isReady ? '✅ 已就绪' : '⏳ 未就绪' }}
          </span>
        </div>
        <div class="status-item" v-if="testResult">
          <span class="label">测试结果:</span>
          <span :class="['badge', testResult.success ? 'success' : 'danger']">
            {{ testResult.success ? '✅ 成功' : '❌ 失败' }}
          </span>
        </div>
      </div>

      <!-- 当前 Token 信息 -->
      <div class="token-section">
        <h3>当前 Token</h3>
        <div v-if="authStore.token" class="token-info">
          <div class="info-row">
            <span class="label">Token:</span>
            <code>{{ maskToken(authStore.token) }}</code>
          </div>
          <div class="info-row">
            <span class="label">有效性:</span>
            <span :class="isTokenValid ? 'text-success' : 'text-danger'">
              {{ isTokenValid ? '✅ 有效' : '❌ 无效' }}
            </span>
          </div>
          <div class="info-row" v-if="tokenInfo">
            <span class="label">签发日期:</span>
            <span>{{ tokenInfo.issuedDate }}</span>
          </div>
          <div class="info-row" v-if="tokenInfo">
            <span class="label">是否当天签发:</span>
            <span :class="tokenInfo.isToday ? 'text-success' : 'text-warning'">
              {{ tokenInfo.isToday ? '✅ 是' : '⚠️ 否' }}
            </span>
          </div>
        </div>
        <div v-else class="no-token">
          <span>暂无 Token</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <h3>测试操作</h3>
        <div class="button-grid">
          <button @click="testLogin" :disabled="testing || !isReady" class="btn btn-primary">
            {{ testing ? '测试中...' : '测试 Bridge 登录' }}
          </button>
          <button @click="testGetToken" :disabled="testing || !isReady" class="btn btn-secondary">
            {{ testing ? '测试中...' : '获取 Token' }}
          </button>
          <button @click="testApiRequest" :disabled="testing" class="btn btn-info">
            {{ testing ? '测试中...' : '测试 API 请求' }}
          </button>
          <button @click="clearToken" class="btn btn-danger">🗑️ 清除 Token</button>
          <button @click="testTokenClearAndRelogin" :disabled="testing" class="btn btn-warning">
            {{ testing ? '测试中...' : '🔐 清除并重新登录' }}
          </button>
        </div>
      </div>

      <!-- 测试日志 -->
      <div class="logs-section">
        <h3>测试日志</h3>
        <div class="logs">
          <div v-for="(log, index) in logs" :key="index" :class="['log-item', log.type]">
            <span class="time">{{ log.time }}</span>
            <span class="level">[{{ log.level }}]</span>
            <span class="message">{{ log.message }}</span>
          </div>
        </div>
        <button @click="clearLogs" class="btn btn-small">清空日志</button>
      </div>

      <!-- 测试结果显示 -->
      <div class="result-section" v-if="testResult">
        <h3>测试结果详情</h3>
        <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useWebViewBridge } from '@/composables/useWebViewBridge'

  const authStore = useAuthStore()
  const { isReady, isInMiniProgram, login, getMallToken } = useWebViewBridge({
    debug: true,
    autoInit: true
  })

  const testing = ref(false)
  const testResult = ref<any>(null)
  const logs = ref<Array<{ time: string; level: string; message: string; type: string }>>([])
  const tokenInfo = ref<{
    issuedDate: string
    isToday: boolean
  } | null>(null)

  // 计算属性：检查 token 是否有效
  const isTokenValid = computed(() => {
    if (!authStore.token) return false
    return authStore.isTokenValid()
  })

  // 添加日志
  const addLog = (level: string, message: string) => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

    logs.value.unshift({
      time,
      level,
      message,
      type: level.toLowerCase()
    })
  }

  // 遮蔽 token
  const maskToken = (token: string) => {
    if (!token) return ''
    return token.substring(0, 10) + '...' + token.substring(token.length - 10)
  }

  // 测试登录
  const testLogin = async () => {
    testing.value = true
    addLog('INFO', '开始测试 Bridge 登录...')

    try {
      if (!isReady.value) {
        throw new Error('Bridge 未就绪')
      }

      addLog('INFO', '通过 WebView Bridge 请求登录...')
      const result = await login()

      addLog('SUCCESS', '登录请求成功')
      addLog('INFO', `Token: ${maskToken(result.token)}`)

      if (result.userInfo) {
        addLog('INFO', `用户信息: ${JSON.stringify(result.userInfo)}`)
      }

      testResult.value = {
        success: true,
        result
      }

      // 更新 auth store
      authStore.token = result.token
      if (result.userInfo) {
        authStore.user = result.userInfo
      }

      updateTokenInfo()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '登录失败'
      addLog('ERROR', `登录失败: ${errorMsg}`)
      testResult.value = {
        success: false,
        error: errorMsg
      }
    } finally {
      testing.value = false
    }
  }

  // 测试获取 token
  const testGetToken = async () => {
    testing.value = true
    addLog('INFO', '开始测试获取 Token...')

    try {
      if (!isReady.value) {
        throw new Error('Bridge 未就绪')
      }

      addLog('INFO', '通过 WebView Bridge 获取 Token...')
      const result = await getMallToken()

      addLog('SUCCESS', '获取 Token 成功')
      addLog('INFO', `Token: ${maskToken(result.token)}`)

      if (result.user) {
        addLog('INFO', `用户信息: ${JSON.stringify(result.user)}`)
      }

      testResult.value = {
        success: true,
        result
      }

      // 更新 auth store
      authStore.token = result.token
      if (result.user) {
        authStore.user = result.user
      }

      updateTokenInfo()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '获取 Token 失败'
      addLog('ERROR', `获取 Token 失败: ${errorMsg}`)
      testResult.value = {
        success: false,
        error: errorMsg
      }
    } finally {
      testing.value = false
    }
  }

  // 测试 API 请求
  const testApiRequest = async () => {
    testing.value = true
    addLog('INFO', '开始测试 API 请求...')

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        addLog('SUCCESS', 'API 请求成功')
        addLog('INFO', `响应数据: ${JSON.stringify(data)}`)
        testResult.value = {
          success: true,
          response: data
        }
      } else if (response.status === 401) {
        addLog('WARNING', 'API 返回 401，token 失效')
        addLog('INFO', '将触发自动重新登录流程')

        // 触发登录测试
        await testLogin()
      } else {
        throw new Error(`API 请求失败: ${response.status}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'API 请求失败'
      addLog('ERROR', `API 请求失败: ${errorMsg}`)
      testResult.value = {
        success: false,
        error: errorMsg
      }
    } finally {
      testing.value = false
    }
  }

  // 清除 token
  const clearToken = () => {
    authStore.clearAuth()
    tokenInfo.value = null
    testResult.value = null
    addLog('INFO', '已清除 Token')
  }

  // 测试清除 Token 并触发小程序重新登录
  const testTokenClearAndRelogin = async () => {
    testing.value = true
    addLog('INFO', '开始测试清除 Token 并触发重新登录...')

    try {
      // 1. 清除 token
      addLog('INFO', '步骤1: 清除 Token...')
      authStore.clearAuth()
      tokenInfo.value = null
      addLog('SUCCESS', 'Token 已清除')

      // 2. 等待小程序响应并重新登录
      addLog('INFO', '步骤2: 等待小程序接收消息并重新登录...')
      addLog('INFO', '小程序应该会自动弹出登录界面')

      // 3. 等待一小段时间后检查 token 是否恢复
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 4. 尝试获取新的 token
      addLog('INFO', '步骤3: 尝试获取新的 Token...')
      if (authStore.token) {
        addLog('SUCCESS', '✅ 重新登录成功！新 Token: ' + maskToken(authStore.token))
        updateTokenInfo()
        testResult.value = {
          success: true,
          message: '清除并重新登录测试成功'
        }
      } else {
        addLog('WARNING', '⚠️ Token 尚未恢复，可能需要手动操作')
        testResult.value = {
          success: false,
          message: 'Token 未自动恢复'
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '测试失败'
      addLog('ERROR', `测试失败: ${errorMsg}`)
      testResult.value = {
        success: false,
        error: errorMsg
      }
    } finally {
      testing.value = false
    }
  }

  // 清除日志
  const clearLogs = () => {
    logs.value = []
  }

  // 更新 token 信息
  const updateTokenInfo = () => {
    if (!authStore.token) {
      tokenInfo.value = null
      return
    }

    try {
      const payload = JSON.parse(atob(authStore.token.split('.')[1]))
      const issueTime = payload.iat * 1000
      const issueDate = new Date(issueTime)
      const today = new Date()

      tokenInfo.value = {
        issuedDate: issueDate.toLocaleString('zh-CN'),
        isToday:
          today.getFullYear() === issueDate.getFullYear() &&
          today.getMonth() === issueDate.getMonth() &&
          today.getDate() === issueDate.getDate()
      }
    } catch (error) {
      console.error('Failed to parse token info:', error)
      tokenInfo.value = null
    }
  }

  // 初始化
  onMounted(() => {
    addLog('INFO', '页面已加载，开始初始化...')

    if (authStore.token) {
      updateTokenInfo()
      addLog('INFO', '检测到现有 Token')
    }

    // 监听 token 变化
    setInterval(() => {
      if (authStore.token && !tokenInfo.value) {
        updateTokenInfo()
      }
    }, 1000)
  })
</script>

<style scoped>
  .bridge-login-test {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 20px;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    padding: 30px;
  }

  h1 {
    margin: 0 0 30px;
    color: #333;
    text-align: center;
  }

  h3 {
    margin-top: 20px;
    margin-bottom: 15px;
    color: #555;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 10px;
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
    padding: 8px;
  }

  .status-item:last-child {
    margin-bottom: 0;
  }

  .label {
    font-weight: 600;
    color: #333;
  }

  .badge {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
  }

  .badge.success {
    background: #d4edda;
    color: #155724;
  }

  .badge.warning {
    background: #fff3cd;
    color: #856404;
  }

  .badge.danger {
    background: #f8d7da;
    color: #721c24;
  }

  .token-section,
  .actions-section,
  .logs-section,
  .result-section {
    margin-bottom: 30px;
  }

  .token-info {
    background: #e7f3ff;
    padding: 15px;
    border-radius: 8px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #d0d0d0;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-row code {
    font-family: 'Monaco', 'Courier New', monospace;
    background: #f1f1f1;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }

  .no-token {
    text-align: center;
    padding: 20px;
    color: #999;
  }

  .button-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  }

  .btn {
    padding: 12px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #545b62;
  }

  .btn-info {
    background: #17a2b8;
    color: white;
  }

  .btn-info:hover:not(:disabled) {
    background: #138496;
  }

  .btn-warning {
    background: #ffc107;
    color: #333;
  }

  .btn-warning:hover:not(:disabled) {
    background: #e0a800;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
  }

  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
  }

  .text-success {
    color: #28a745;
    font-weight: 600;
  }

  .text-danger {
    color: #dc3545;
    font-weight: 600;
  }

  .text-warning {
    color: #ffc107;
    font-weight: 600;
  }

  .logs {
    max-height: 400px;
    overflow-y: auto;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 15px;
    border-radius: 6px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 12px;
  }

  .log-item {
    padding: 6px 0;
    display: flex;
    gap: 10px;
    border-bottom: 1px solid #333;
  }

  .log-item:last-child {
    border-bottom: none;
  }

  .log-item .time {
    color: #858585;
    min-width: 80px;
  }

  .log-item .level {
    font-weight: 600;
    min-width: 60px;
  }

  .log-item.info .level {
    color: #4ec9b0;
  }

  .log-item.success .level {
    color: #4ec26f;
  }

  .log-item.info .level {
    color: #4ec9b0;
  }

  .log-item.warning .level {
    color: #dcdcaa;
  }

  .log-item.error .level {
    color: #f48771;
  }

  .log-item .message {
    flex: 1;
  }

  .result-section pre {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid #dee2e6;
  }
</style>
