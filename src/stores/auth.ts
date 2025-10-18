import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse } from '@/types'
import type { LoginCredentials } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const userRole = ref<'customer' | 'admin' | 'operator'>('customer')
  const isLoggedIn = computed(() => !!token.value)

  // 登录方法
  const login = async (credentials: LoginCredentials) => {
    try {
      // 这里应该调用实际的API登录接口
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data: AuthResponse = await response.json()

      if (data.code === 200) {
        user.value = data.data.user
        token.value = data.data.token
        refreshToken.value = data.data.refreshToken || ''
        userRole.value = data.data.user.role

        // 保存到本地存储
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('refreshToken', refreshToken.value)

        return { success: true, message: '登录成功' }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  // 微信登录方法
  const loginWithWechat = async (code: string) => {
    try {
      const response = await fetch('/api/auth/wechat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })

      const data: AuthResponse = await response.json()

      if (data.code === 200) {
        user.value = data.data.user
        token.value = data.data.token
        refreshToken.value = data.data.refreshToken || ''
        userRole.value = data.data.user.role

        // 保存到本地存储
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        localStorage.setItem('refreshToken', refreshToken.value)

        return { success: true, message: '微信登录成功' }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  // 退出登录
  const logout = () => {
    user.value = null
    token.value = ''
    refreshToken.value = ''
    userRole.value = 'customer'

    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
  }

  // 刷新token
  const refreshTokenAction = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: refreshToken.value })
      })

      const data: AuthResponse = await response.json()

      if (data.code === 200) {
        token.value = data.data.token
        localStorage.setItem('token', token.value)
        return { success: true, message: 'Token刷新成功' }
      } else {
        // 刷新失败，可能token过期，需要重新登录
        logout()
        return { success: false, message: '登录已过期，请重新登录' }
      }
    } catch (error) {
      console.error('刷新token失败:', error)
      logout()
      return { success: false, message: '网络错误，请重新登录' }
    }
  }

  // 获取用户信息
  const getUserInfo = async () => {
    if (!token.value) {
      return { success: false, message: '未登录' }
    }

    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      const data: { code: number; message: string; data: User } = await response.json()

      if (data.code === 200) {
        user.value = data.data
        userRole.value = data.data.role
        localStorage.setItem('user', JSON.stringify(data.data))
        return { success: true, message: '获取用户信息成功' }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  // 检查和初始化用户状态
  const initializeAuth = () => {
    // 从本地存储恢复token
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    const savedRefreshToken = localStorage.getItem('refreshToken')

    if (savedToken) {
      token.value = savedToken
    }

    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
        userRole.value = user.value.role
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }

    if (savedRefreshToken) {
      refreshToken.value = savedRefreshToken
    }
  }

  // 更新用户信息
  const updateUserInfo = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  // 检查用户权限
  const hasPermission = (role: 'admin' | 'operator' | 'customer' | string[] | string) => {
    if (role === '*') return true
    if (Array.isArray(role)) {
      return role.includes(userRole.value)
    }
    return userRole.value === role
  }

  return {
    // 状态
    user,
    token,
    refreshToken,
    userRole,
    isLoggedIn,

    // 方法
    login,
    loginWithWechat,
    logout,
    refreshTokenAction,
    getUserInfo,
    initializeAuth,
    updateUserInfo,
    hasPermission
  }
})