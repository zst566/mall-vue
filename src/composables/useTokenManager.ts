import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface TokenState {
  token: string | null
  refreshToken: string | null
  isRefreshing: boolean
  refreshCount: number
  expiresAt: number | null
  isValid: boolean
  error: string | null
}

interface TokenOptions {
  refreshThreshold?: number // 提前刷新的阈值（毫秒）
  maxRefreshAttempts?: number // 最大刷新尝试次数
  autoRefresh?: boolean // 是否自动刷新
  silentRefresh?: boolean // 是否静默刷新（不显示加载状态）
}

export function useTokenManager(options: TokenOptions = {}) {
  const authStore = useAuthStore()

  // 计时器变量
  let refreshTimer: number | null = null
  let checkTimer: number | null = null

  // 默认选项
  const defaultOptions: Required<TokenOptions> = {
    refreshThreshold: 5 * 60 * 1000, // 5分钟
    maxRefreshAttempts: 3,
    autoRefresh: true,
    silentRefresh: true
  }

  const config = { ...defaultOptions, ...options }

  // Token状态
  const tokenState = ref<TokenState>({
    token: null,
    refreshToken: null,
    isRefreshing: false,
    refreshCount: 0,
    expiresAt: null,
    isValid: false,
    error: null
  })

  // 加载状态
  const isLoading = ref(false)
  const lastRefreshError = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!tokenState.value.token)
  const isTokenExpired = computed(() => {
    if (!tokenState.value.expiresAt) return false
    return Date.now() >= tokenState.value.expiresAt
  })

  const isTokenExpiringSoon = computed(() => {
    if (!tokenState.value.expiresAt) return false
    return Date.now() >= (tokenState.value.expiresAt - config.refreshThreshold)
  })

  const timeUntilExpiry = computed(() => {
    if (!tokenState.value.expiresAt) return 0
    return Math.max(0, tokenState.value.expiresAt - Date.now())
  })

  // 定时器（已在上面声明）

  // 解析JWT token获取过期时间
  const parseTokenExpiry = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 // 转换为毫秒时间戳
    } catch (error) {
      console.warn('Failed to parse token expiry:', error)
      return null
    }
  }

  // 初始化token状态
  const initializeTokenState = () => {
    const token = authStore.token
    const refreshToken = authStore.refreshToken

    if (token) {
      const expiresAt = parseTokenExpiry(token)
      tokenState.value = {
        token,
        refreshToken,
        isRefreshing: false,
        refreshCount: 0,
        expiresAt,
        isValid: !!expiresAt && !isTokenExpired.value,
        error: null
      }

      // 开始自动监控
      if (config.autoRefresh) {
        startAutoRefresh()
        startTokenCheck()
      }
    } else {
      tokenState.value = {
        token: null,
        refreshToken: null,
        isRefreshing: false,
        refreshCount: 0,
        expiresAt: null,
        isValid: false,
        error: null
      }
    }
  }

  // 开始自动刷新监控
  const startAutoRefresh = () => {
    if (!tokenState.value.token || tokenState.value.isRefreshing) return

    const timeUntilRefresh = timeUntilExpiry.value - config.refreshThreshold

    if (timeUntilRefresh > 0) {
      refreshTimer = window.setTimeout(async () => {
        try {
          await refreshTokens()
        } catch (error) {
          console.error('Auto token refresh failed:', error)
        }
      }, timeUntilRefresh)
    }
  }

  // 开始token状态检查
  const startTokenCheck = () => {
    checkTimer = window.setInterval(() => {
      if (!tokenState.value.token) return

      const now = Date.now()
      const expiresAt = tokenState.value.expiresAt

      if (expiresAt && now >= expiresAt) {
        handleTokenExpiration()
      }

      // 更新token状态
      updateTokenState()
    }, 30000) // 每30秒检查一次
  }

  // 停止自动刷新
  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
    if (checkTimer) {
      clearInterval(checkTimer)
      checkTimer = null
    }
  }

  // 更新token状态
  const updateTokenState = () => {
    const token = authStore.token
    const refreshToken = authStore.refreshToken

    if (token) {
      const expiresAt = parseTokenExpiry(token)
      tokenState.value = {
        token,
        refreshToken,
        isRefreshing: tokenState.value.isRefreshing,
        refreshCount: tokenState.value.refreshCount,
        expiresAt,
        isValid: !!expiresAt && Date.now() < expiresAt,
        error: tokenState.value.error
      }
    }
  }

  // 刷新token
  const refreshTokens = async (silent: boolean = config.silentRefresh): Promise<boolean> => {
    if (tokenState.value.isRefreshing || !tokenState.value.refreshToken) {
      return false
    }

    try {
      if (!silent) {
        isLoading.value = true
        tokenState.value.isRefreshing = true
      }

      // 这里应该调用实际的API刷新token
      // const response = await apiClient.post('/auth/refresh', {
      //   refreshToken: tokenState.value.refreshToken
      // })

      // 模拟token刷新
      const newToken = `new_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newRefreshToken = `new_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 更新存储的token
      authStore.updateTokens({
        token: newToken,
        refreshToken: newRefreshToken
      })

      // 更新状态
      const expiresAt = parseTokenExpiry(newToken)
      tokenState.value = {
        token: newToken,
        refreshToken: newRefreshToken,
        isRefreshing: false,
        refreshCount: tokenState.value.refreshCount + 1,
        expiresAt,
        isValid: !!expiresAt && Date.now() < expiresAt,
        error: null
      }

      // 重新启动自动刷新
      stopAutoRefresh()
      startAutoRefresh()

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed'
      lastRefreshError.value = errorMessage

      tokenState.value.isRefreshing = false
      tokenState.value.error = errorMessage
      tokenState.value.isValid = false

      // 如果达到最大刷新次数，清除认证信息
      if (tokenState.value.refreshCount >= config.maxRefreshAttempts) {
        authStore.clearAuth()
        tokenState.value.token = null
        tokenState.value.refreshToken = null
        stopAutoRefresh()
      }

      return false
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  // 处理token过期
  const handleTokenExpiration = async () => {
    if (tokenState.value.refreshToken) {
      const success = await refreshTokens(true)
      if (!success) {
        // 刷新失败，跳转到登录页
        authStore.clearAuth()
        window.location.href = '/login'
      }
    } else {
      // 没有refresh token，直接跳转登录
      authStore.clearAuth()
      window.location.href = '/login'
    }
  }

  // 强制刷新token
  const forceRefreshToken = async (): Promise<boolean> => {
    return await refreshTokens(false)
  }

  // 清除token
  const clearTokens = () => {
    authStore.clearAuth()
    stopAutoRefresh()
    tokenState.value = {
      token: null,
      refreshToken: null,
      isRefreshing: false,
      refreshCount: 0,
      expiresAt: null,
      isValid: false,
      error: null
    }
    lastRefreshError.value = null
  }

  // 验证token有效性
  const verifyToken = async (): Promise<boolean> => {
    try {
      // 这里应该调用API验证token
      // const response = await apiClient.get('/auth/validate-token')
      // return response.valid

      // 模拟验证
      return !!tokenState.value.token && tokenState.value.isValid
    } catch (error) {
      return false
    }
  }

  // 获取token头信息
  const getAuthorizationHeader = (): string | null => {
    if (!tokenState.value.token) return null
    return `Bearer ${tokenState.value.token}`
  }

  // 设置token
  const setToken = (token: string, refreshToken?: string): void => {
    const expiresAt = parseTokenExpiry(token)
    if (authStore.user) {
      authStore.setAuth({
        token,
        refreshToken: refreshToken || '',
        user: authStore.user
      })
    }

    tokenState.value = {
      token,
      refreshToken: refreshToken || '',
      isRefreshing: false,
      refreshCount: 0,
      expiresAt,
      isValid: !!expiresAt && Date.now() < expiresAt,
      error: null
    }

    // 重新启动自动刷新
    stopAutoRefresh()
    if (config.autoRefresh) {
      startAutoRefresh()
      startTokenCheck()
    }
  }

  // 组件挂载时初始化（只在组件内部调用）
  const initializeLifecycle = () => {
    onMounted(() => {
      initializeTokenState()

      // 监听storage变化（其他标签页的token变化）
      window.addEventListener('storage', handleStorageChange)
    })

    // 组件卸载时清理
    onUnmounted(() => {
      stopAutoRefresh()
      window.removeEventListener('storage', handleStorageChange)
    })
  }

  // 处理storage变化
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'auth_token') {
      initializeTokenState()
    }
  }

  return {
    tokenState,
    isAuthenticated,
    isTokenExpired,
    isTokenExpiringSoon,
    timeUntilExpiry,
    isLoading,
    lastRefreshError,
    refreshTokens,
    forceRefreshToken,
    clearTokens,
    verifyToken,
    getAuthorizationHeader,
    setToken,
    initializeLifecycle
  }
}

// 导出单例实例（延迟创建）
let _tokenManagerInstance: ReturnType<typeof useTokenManager> | null = null

export const tokenManagerInstance = {
  get instance() {
    if (!_tokenManagerInstance) {
      _tokenManagerInstance = useTokenManager()
    }
    return _tokenManagerInstance
  }
}