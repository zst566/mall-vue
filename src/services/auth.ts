import { apiClient, BaseApiService, ApiErrorHandler } from './api'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export class AuthService extends BaseApiService {
  constructor() {
    super()
  }

  // 用户登录
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/login', credentials)

      // 保存认证信息到Pinia
      const authStore = useAuthStore()
      authStore.setAuth({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user
      })

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 用户注册
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.client.post<RegisterResponse>('/auth/register', userData)

      // 注册成功后自动登录
      const authStore = useAuthStore()
      authStore.setAuth({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user
      })

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 用户登出
  async logout(): Promise<void> {
    try {
      const authStore = useAuthStore()

      // 调用后端登出接口
      await this.client.post('/auth/logout')

      // 清除本地认证信息
      authStore.clearAuth()

      // 跳转到登录页
      router.push('/login')
    } catch (error) {
      // 即使登出接口失败，也要清除本地信息
      const authStore = useAuthStore()
      authStore.clearAuth()
      router.push('/login')

      console.warn('Logout API call failed, but local auth cleared:', error)
    }
  }

  // 刷新访问令牌
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    try {
      const authStore = useAuthStore()

      const response = await this.client.post('/auth/refresh', {
        refreshToken: authStore.refreshToken
      })

      const newToken = response.data.token
      const newRefreshToken = response.data.refreshToken

      // 更新存储的令牌
      authStore.updateTokens({
        token: newToken,
        refreshToken: newRefreshToken
      })

      return {
        token: newToken,
        refreshToken: newRefreshToken
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)

      // 刷新失败，清除认证信息
      const authStore = useAuthStore()
      authStore.clearAuth()
      router.push('/login')

      throw new Error(errorMessage)
    }
  }

  // 重置密码
  async resetPassword(email: string): Promise<void> {
    try {
      await this.client.post('/auth/reset-password', { email })
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 验证重置密码令牌
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    try {
      const response = await this.client.post('/auth/verify-reset-token', { token })
      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 设置新密码
  async setNewPassword(token: string, newPassword: string): Promise<void> {
    try {
      await this.client.post('/auth/set-new-password', { token, password: newPassword })
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 更新用户资料
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await this.client.patch<User>('/user/profile', profileData)

      // 更新本地存储的用户信息
      const authStore = useAuthStore()
      authStore.updateUser(response.data)

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 更新用户头像
  async updateAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const response = await this.client.post<{ avatarUrl: string }>('/user/avatar', file, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // 更新本地存储的用户信息
      const authStore = useAuthStore()
      authStore.updateUser({ avatarUrl: response.data.avatarUrl })

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 获取用户资料
  async getProfile(): Promise<User> {
    try {
      const response = await this.client<User>('/user/profile')
      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 修改密码
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.client.post('/user/change-password', {
        currentPassword,
        newPassword
      })
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 绑定手机号
  async bindPhone(phone: string, verificationCode: string): Promise<User> {
    try {
      const response = await this.client.post<User>('/user/bind-phone', {
        phone,
        verificationCode
      })

      // 更新本地存储的用户信息
      const authStore = useAuthStore()
      authStore.updateUser(response.data)

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 发送手机验证码
  async sendPhoneVerificationCode(phone: string): Promise<void> {
    try {
      await this.client.post('/user/send-phone-code', { phone })
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 检查手机号是否已绑定
  async checkPhoneExists(phone: string): Promise<{ exists: boolean; userId?: string }> {
    try {
      const response = await this.client.post<{ exists: boolean; userId?: string }>('/user/check-phone', { phone })
      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }
}

// 导出单例实例
export const authService = new AuthService()