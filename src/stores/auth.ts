import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse, UserRole } from '@/types'
import type { LoginCredentials } from '@/types/user'
import { authService } from '@/services/auth'
import { usePermission } from '@/utils/permission'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const userRole = ref<UserRole>('customer')
  const isAuthenticated = computed(() => !!token.value)
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isLoading = ref(false)
  const error = ref<string>('')

  // 初始化时从localStorage恢复状态
  const initializeFromStorage = () => {
    console.log('🔐 开始从LocalStorage初始化认证状态')
    try {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      const savedRefreshToken = localStorage.getItem('refreshToken')

      console.log('📦 LocalStorage中的数据:')
      console.log('  - token:', savedToken ? '存在' : '不存在')
      console.log('  - user:', savedUser ? '存在' : '不存在')
      console.log('  - refreshToken:', savedRefreshToken ? '存在' : '不存在')

      if (savedToken) {
        token.value = savedToken
        console.log('✅ Token已恢复')
      }

      if (savedRefreshToken) {
        refreshToken.value = savedRefreshToken
        console.log('✅ RefreshToken已恢复')
      }

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser)
        user.value = parsedUser
        if (parsedUser && parsedUser.role) {
          userRole.value = parsedUser.role
        }
        console.log('✅ 用户信息已恢复:', parsedUser)
      }
      
      console.log('🔐 认证状态初始化完成')
      console.log('📊 当前状态:')
      console.log('  - hasToken:', !!token.value)
      console.log('  - hasUser:', !!user.value)
      console.log('  - userRole:', userRole.value)
    } catch (error) {
      console.error('❌ 从LocalStorage初始化认证状态失败:', error)
      clearAuth()
    }
  }

  // 登录方法
  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await authService.login(credentials)

      if (response.success) {
        user.value = response.data.user
        // 优先使用 token 字段（与微信小程序 webview 统一命名），如果没有则使用 accessToken（向后兼容）
        const authToken = response.data.token || response.data.accessToken
        if (!authToken) {
          throw new Error('登录失败：未获取到 token 或 accessToken')
        }
        token.value = authToken
        refreshToken.value = response.data.refreshToken || ''
        if (response.data.user && response.data.user.role) {
          userRole.value = response.data.user.role
        }

        // 自动保存到localStorage
        saveToLocalStorage()

        return { success: true, message: '登录成功' }
      } else {
        error.value = response.message
        return response
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      const errorMessage = error.message || '网络错误，请稍后重试'
      error.value = errorMessage
      return { success: false, message: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  // 微信登录方法
  const loginWithWechat = async (code: string) => {
    console.log('🔐 开始微信登录流程')
    console.log('📝 微信授权码:', code)
    try {
      isLoading.value = true
      error.value = ''

      // 调用真实的微信登录API
      console.log('📡 调用微信登录API...')
      const response = await authService.loginWithWechat(code)
      console.log('📡 API响应:', response)

      if (response.success) {
        console.log('✅ 微信登录成功')
        console.log('📋 用户信息:', response.data.user)
        console.log('🔑 AccessToken:', response.data.accessToken ? '已获取' : '未获取')
        
        user.value = response.data.user
        // 优先使用 token 字段（与微信小程序 webview 统一命名），如果没有则使用 accessToken（向后兼容）
        const authToken = response.data.token || response.data.accessToken
        if (!authToken) {
          throw new Error('微信登录失败：未获取到 token 或 accessToken')
        }
        token.value = authToken
        refreshToken.value = response.data.refreshToken || ''
        userRole.value = response.data.user.role

        saveToLocalStorage()
        console.log('💾 认证信息已保存到LocalStorage')

        console.log('🎉 微信登录完成')
        return { success: true, message: '微信登录成功' }
      } else {
        console.error('❌ 微信登录失败:', response.message)
        error.value = response.message
        return response
      }
    } catch (error: any) {
      console.error('❌ 微信登录异常:', error)
      const errorMessage = error.message || '微信登录失败'
      error.value = errorMessage
      return { success: false, message: errorMessage }
    } finally {
      isLoading.value = false
      console.log('🔐 微信登录流程结束')
    }
  }

  // 注册方法
  const register = async (userData: any) => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await authService.register(userData)

      if (response.success) {
        user.value = response.data.user
        // 优先使用 token 字段（与微信小程序 webview 统一命名），如果没有则使用 accessToken（向后兼容）
        const authToken = response.data.token || response.data.accessToken
        if (!authToken) {
          throw new Error('注册失败：未获取到 token 或 accessToken')
        }
        token.value = authToken
        refreshToken.value = response.data.refreshToken || ''
        userRole.value = response.data.user.role

        saveToLocalStorage()

        return { success: true, message: '注册成功' }
      } else {
        error.value = response.message
        return response
      }
    } catch (error: any) {
      console.error('注册失败:', error)
      return { success: false, message: error.message || '注册失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 登出方法
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('登出API调用失败:', error)
      // 即使API调用失败，也要清除本地状态
    } finally {
      clearAuth()
    }
  }

  // 刷新Token方法
  const refreshTokens = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('没有刷新令牌')
      }

      const response = await authService.refreshToken()

      if (response.success) {
        // 优先使用 token 字段（与微信小程序 webview 统一命名），如果没有则使用 accessToken（向后兼容）
        const authToken = response.data.token || response.data.accessToken
        if (!authToken) {
          throw new Error('刷新令牌失败：未获取到 token 或 accessToken')
        }
        token.value = authToken
        refreshToken.value = response.data.refreshToken || ''
        saveToLocalStorage()
        return { success: true, message: 'Token刷新成功' }
      } else {
        // 刷新失败，清除认证状态
        clearAuth()
        return response
      }
    } catch (error: any) {
      console.error('刷新token失败:', error)
      clearAuth()
      return { success: false, message: '登录已过期，请重新登录' }
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    console.log('👤 开始获取用户信息')
    try {
      isLoading.value = true

      if (!token.value) {
        console.warn('⚠️  未登录，无法获取用户信息')
        return { success: false, message: '未登录' }
      }

      console.log('📡 调用获取用户信息API...')
      const response = await authService.getProfile()
      console.log('📡 API响应:', response)

      if (response.success) {
        console.log('✅ 获取用户信息成功')
        console.log('📋 用户信息:', response.data)
        
        user.value = response.data
        if (response.data && response.data.role) {
          userRole.value = response.data.role
        }
        saveToLocalStorage()
        console.log('💾 用户信息已保存到LocalStorage')
        
        return { success: true, message: '获取用户信息成功' }
      } else {
        console.error('❌ 获取用户信息失败:', response.message)
        error.value = response.message
        return response
      }
    } catch (error: any) {
      console.error('❌ 获取用户信息异常:', error)
      return { success: false, message: error.message || '获取用户信息失败' }
    } finally {
      isLoading.value = false
      console.log('👤 获取用户信息流程结束')
    }
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    console.log('🔄 updateUser 被调用')
    console.log('📥 传入的 userData:', userData)
    console.log('👤 当前 user.value:', user.value)
    
    if (user.value) {
      console.log('✅ user.value 存在，进行合并更新')
      user.value = { ...user.value, ...userData }
      saveToLocalStorage()
    } else if (userData && typeof userData === 'object') {
      console.log('✨ user.value 为空，创建新用户对象')
      // 如果 user.value 为空，但有数据传入，则创建新用户对象
      user.value = userData as User
      saveToLocalStorage()
    } else {
      console.warn('⚠️ 未执行任何更新操作')
    }
    
    console.log('👤 更新后的 user.value:', user.value)
  }

  // 更新Token信息
  const updateTokens = (tokenData: { token: string; refreshToken: string }) => {
    token.value = tokenData.token
    refreshToken.value = tokenData.refreshToken
    saveToLocalStorage()
  }

  // 清除认证状态
  const clearAuth = () => {
    user.value = null
    token.value = ''
    refreshToken.value = ''
    userRole.value = 'customer'
    error.value = ''

    // 清除localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')

    // 🔥 如果在微信小程序 webview 中，通知小程序重新登录
    if (typeof window !== 'undefined' && window.wx?.miniProgram?.postMessage) {
      try {
        console.log('📱 通知小程序 Token 已清除，需要重新登录')
        window.wx.miniProgram.postMessage({
          type: 'authTokenCleared',
          data: {
            message: 'Token has been cleared, please login again',
            timestamp: Date.now()
          }
        })
      } catch (error) {
        console.error('通知小程序失败:', error)
      }
    }
  }

  // 保存到localStorage
  const saveToLocalStorage = () => {
    console.log('💾 保存认证信息到LocalStorage')
    
    if (token.value) {
      localStorage.setItem('token', token.value)
      console.log('  ✅ Token已保存')
    }
    if (refreshToken.value) {
      localStorage.setItem('refreshToken', refreshToken.value)
      console.log('  ✅ RefreshToken已保存')
    }
    if (user.value) {
      localStorage.setItem('user', JSON.stringify(user.value))
      console.log('  ✅ 用户信息已保存')
    }
  }

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    const { hasPermission: checkPermission } = usePermission()
    return checkPermission(permission as any)
  }

  // 检查角色
  const hasRole = (role: string): boolean => {
    return userRole.value === role
  }

  // 记录是否有未保存的数据
  const hasUnsavedData = ref(false)

  // 标记数据为未保存
  const markUnsavedData = (unsaved: boolean) => {
    hasUnsavedData.value = unsaved
  }

  // 初始化认证状态
  const initializeAuth = () => {
    initializeFromStorage()
  }

  // 设置认证状态
  const setAuth = (authData: { user: User; token: string; refreshToken?: string }) => {
    user.value = authData.user
    token.value = authData.token
    refreshToken.value = authData.refreshToken || ''
    userRole.value = authData.user.role
    saveToLocalStorage()
  }

  // 设置用户信息
  const setUser = (userData: User) => {
    user.value = userData
    userRole.value = userData.role
    saveToLocalStorage()
  }

  // 初始化
  initializeFromStorage()

  // 自动刷新token检查
  setInterval(async () => {
    if (token.value && refreshToken.value) {
      // 检查token是否即将过期（提前5分钟）
      const tokenExpiry = getTokenExpiry(token.value)
      if (tokenExpiry && Date.now() > tokenExpiry - 5 * 60 * 1000) {
        await refreshTokens()
      }
    }
  }, 60000) // 每分钟检查一次

  // 辅助函数：获取token过期时间
  const getTokenExpiry = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 // 转换为毫秒
    } catch (error) {
      console.error('Failed to parse token expiry:', error)
      return null
    }
  }

  // 检查 token 是否为当天签发
  const isTokenIssuedToday = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const issueTime = payload.iat * 1000 // 签发时间（毫秒）
      const now = Date.now()
      const today = new Date(now)
      const tokenIssuedDate = new Date(issueTime)
      
      // 比较年月日
      return (
        today.getFullYear() === tokenIssuedDate.getFullYear() &&
        today.getMonth() === tokenIssuedDate.getMonth() &&
        today.getDate() === tokenIssuedDate.getDate()
      )
    } catch (error) {
      console.error('Failed to check token issue date:', error)
      return false
    }
  }

  // 检查 token 是否有效（只检查是否过期，不检查签发日期）
  // 注意：JWT token 的有效期是 24 小时，不需要限制为当天签发
  const isTokenValid = (): boolean => {
    if (!token.value) {
      return false
    }

    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const exp = payload.exp
      
      // 只检查是否过期
      const currentTime = Math.floor(Date.now() / 1000)
      if (exp && exp < currentTime) {
        console.log('Token expired')
        return false
      }
      
      // Token 未过期，认为有效
      return true
    } catch (error) {
      console.error('Failed to validate token:', error)
      return false
    }
  }

  return {
    // 状态
    user,
    token,
    refreshToken,
    userRole,
    isAuthenticated,
    isLoggedIn,
    isLoading,
    error,
    hasUnsavedData,

    // 计算属性
    hasPermission,
    hasRole,

    // 方法
    login,
    loginWithWechat,
    register,
    logout,
    refreshTokens,
    getUserInfo,
    updateUser,
    updateTokens,
    clearAuth,
    markUnsavedData,
    initializeFromStorage,
    initializeAuth,
    setAuth,
    setUser,

    // Token 验证方法
    isTokenIssuedToday,
    isTokenValid
  }
})