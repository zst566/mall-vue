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
      // 统一使用 accessToken（后端返回的字段名），避免不同项目使用不同的变量名
      const authStore = useAuthStore()
      if (!response.data.data.accessToken) {
        throw new Error('登录失败：未获取到 accessToken')
      }
      authStore.setAuth({
        token: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
        user: response.data.data.user
      })

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 微信登录
  async loginWithWechat(code: string): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/silent-login', {
        code
      })

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 微信授权登录（获取用户信息）
  async loginWithWechatEnhanced(code: string, userInfo: any): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/enhanced-login', {
        code,
        userInfo
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
      // 统一使用 accessToken（后端返回的字段名），避免不同项目使用不同的变量名
      const authStore = useAuthStore()
      if (!response.data.data.accessToken) {
        throw new Error('注册失败：未获取到 accessToken')
      }
      authStore.setAuth({
        token: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
        user: response.data.data.user
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
  async refreshToken(): Promise<{ success: boolean; data: { token: string; refreshToken: string }; message: string }> {
    try {
      const authStore = useAuthStore()

      const response = await this.client.post('/auth/refresh', {
        refreshToken: authStore.refreshToken
      })

      // 统一使用 accessToken（后端返回的字段名），避免不同项目使用不同的变量名
      const newToken = response.data.accessToken || response.data.token
      const newRefreshToken = response.data.refreshToken

      if (!newToken) {
        throw new Error('刷新令牌失败：未获取到 accessToken')
      }

      // 更新存储的令牌
      authStore.updateTokens({
        token: newToken,
        refreshToken: newRefreshToken
      })

      return {
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        },
        message: 'Token刷新成功'
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)

      // 刷新失败，清除认证信息
      const authStore = useAuthStore()
      authStore.clearAuth()
      router.push('/login')

      return {
        success: false,
        data: { token: '', refreshToken: '' },
        message: errorMessage
      }
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
      const response = await this.client.put<User>('/auth/user-info', profileData)

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
      // 将文件包装在 FormData 中
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await this.client.put<{ avatarUrl: string }>('/auth/user-info', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // 更新本地存储的用户信息
      const authStore = useAuthStore()
      authStore.updateUser({ avatar: response.data.avatarUrl })

      return response.data
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      throw new Error(errorMessage)
    }
  }

  // 获取用户资料
  async getProfile(): Promise<{ success: boolean; data: User; message: string }> {
    try {
      const response = await this.client.get<User>('/auth/current-user')
      return { success: true, data: response.data, message: '获取用户信息成功' }
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      return { success: false, data: null as any, message: errorMessage }
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

  // 获取用户统计数据（积分、优惠券、收藏等）
  // 注意：后端暂未实现此接口，返回默认值
  async getUserStats(): Promise<{ 
    success: boolean
    data: { 
      points: number
      coupons: number
      favorites: number
      unpaidOrders: number
    }
    message: string 
  }> {
    // TODO: 后端实现 /api/auth/stats 接口后，取消注释以下代码
    /*
    try {
      const response = await this.client.get<{
        points: number
        coupons: number
        favorites: number
        unpaidOrders: number
      }>('/auth/stats')
      return { 
        success: true, 
        data: response.data, 
        message: '获取统计数据成功' 
      }
    } catch (error) {
      const errorMessage = ApiErrorHandler.handleApiError(error)
      console.error('获取用户统计数据失败:', errorMessage)
      return { 
        success: false, 
        data: { 
          points: 0, 
          coupons: 0, 
          favorites: 0,
          unpaidOrders: 0
        }, 
        message: errorMessage 
      }
    }
    */
    
    // 暂时返回默认值
    console.warn('⚠️ 用户统计数据接口暂未实现，返回默认值')
    return { 
      success: true, 
      data: { 
        points: 0, 
        coupons: 0, 
        favorites: 0,
        unpaidOrders: 0
      }, 
      message: '统计数据暂未实现' 
    }
  }
}

// 导出单例实例
export const authService = new AuthService()