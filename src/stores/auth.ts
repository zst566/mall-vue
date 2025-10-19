import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse } from '@/types'
import type { LoginCredentials } from '@/types/user'
import { authService } from '@/services/auth'
import { usePermission } from '@/utils/permission'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const userRole = ref<'customer' | 'admin' | 'operator'>('customer')
  const isAuthenticated = computed(() => !!token.value)
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isLoading = ref(false)
  const error = ref<string>('')

  // 初始化时从localStorage恢复状态
  const initializeFromStorage = () => {
    try {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      const savedRefreshToken = localStorage.getItem('refreshToken')

      if (savedToken) {
        token.value = savedToken
      }

      if (savedRefreshToken) {
        refreshToken.value = savedRefreshToken
      }

      if (savedUser) {
        user.value = JSON.parse(savedUser)
        userRole.value = user.value.role
      }
    } catch (error) {
      console.error('Failed to initialize auth state from storage:', error)
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
        token.value = response.data.token
        refreshToken.value = response.data.refreshToken || ''
        userRole.value = response.data.user.role

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
      this.error = errorMessage
      return { success: false, message: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  // 微信登录方法
  const loginWithWechat = async (code: string) => {
    try {
      isLoading.value = true
      error.value = ''

      // 这里应该调用微信登录API
      // const response = await authService.loginWithWechat(code)

      // 模拟微信登录
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'wechat_user_' + Date.now(),
            name: '微信用户',
            avatar: '',
            role: 'customer',
            phone: ''
          },
          token: 'wechat_token_' + Date.now(),
          refreshToken: 'wechat_refresh_' + Date.now()
        }
      }

      if (mockResponse.success) {
        user.value = mockResponse.data.user
        token.value = mockResponse.data.token
        refreshToken.value = mockResponse.data.refreshToken || ''
        userRole.value = mockResponse.data.user.role

        saveToLocalStorage()

        return { success: true, message: '微信登录成功' }
      } else {
        return mockResponse
      }
    } catch (error: any) {
      console.error('微信登录失败:', error)
      return { success: false, message: error.message || '微信登录失败' }
    } finally {
      isLoading.value = false
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
        token.value = response.data.token
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
        token.value = response.data.token
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
    try {
      isLoading.value = true

      if (!token.value) {
        return { success: false, message: '未登录' }
      }

      const response = await authService.getProfile()

      if (response.success) {
        user.value = response.data
        userRole.value = response.data.role
        saveToLocalStorage()
        return { success: true, message: '获取用户信息成功' }
      } else {
        error.value = response.message
        return response
      }
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      return { success: false, message: error.message || '获取用户信息失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      saveToLocalStorage()
    }
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
  }

  // 保存到localStorage
  const saveToLocalStorage = () => {
    if (token.value) {
      localStorage.setItem('token', token.value)
    }
    if (refreshToken.value) {
      localStorage.setItem('refreshToken', refreshToken.value)
    }
    if (user.value) {
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    const { hasPermission } = usePermission()
    return hasPermission(permission)
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
    setUser
  }
})