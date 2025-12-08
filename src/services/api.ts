import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse, ApiError } from '@/types'
import { webViewBridge } from '@/utils/webview-bridge'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

// 基础配置
// 使用相对路径，由 Nginx 网关处理路由转发
const API_BASE_URL = '/api'
const API_TIMEOUT = 10000
const MAX_RETRIES = 3

// 创建axios实例
export const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  // 请求拦截器
  instance.interceptors.request.use(
    async (config) => {
      const authStore = useAuthStore()

      // 在发送请求前检查 token 是否有效（只检查是否过期）
      if (authStore.token) {
        const isValid = authStore.isTokenValid()
        
        if (!isValid) {
          console.log('⚠️ Token 无效（已过期），将在响应拦截器中处理')
        }
      }

      // 添加认证token
      if (authStore.isAuthenticated) {
        config.headers.Authorization = `Bearer ${authStore.token}`
      }

      // 🔥 对于商户绑定状态查询，强制不使用缓存
      if (config.url?.includes('/merchant-operators/my-status')) {
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        config.headers['Pragma'] = 'no-cache'
        config.headers['Expires'] = '0'
      }

      // 添加请求ID用于追踪
      config.headers['X-Request-ID'] = generateRequestId()

      console.log(`[${config.method?.toUpperCase()}] ${config.url}`, {
        params: JSON.stringify(config.params, null, 2),
        data: config.data,
        headers: config.headers
      })

      return config
    },
    (error) => {
      console.error('Request interceptor error:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      const requestId = response.headers['X-Request-ID']
      console.log(`[${response.config.method?.toUpperCase()}] ${response.config.url} [${requestId}] - ${response.status}`, {
        data: response.data,
        headers: response.headers
      })

      return response
    },
    async (error) => {
      const config = error.config
      const requestId = config?.headers?.['X-Request-ID']

      // 工具方法：构造一个保留 response/config 的错误对象，方便重试逻辑识别状态码
      const buildError = (message: string) => {
        const customError: any = new Error(message)
        customError.response = error.response
        customError.config = error.config
        return customError
      }

      // 网络错误处理
      if (!error.response) {
        console.error(
          `[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - Network Error`,
          error.message
        )
        throw new Error('网络连接失败，请检查网络设置')
      }

      const { status, data } = error.response

      // 错误日志记录
      console.error(`[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - ${status}`, {
        error: data,
        headers: error.response.headers
      })

      // 商户相关API的403错误处理（权限被取消）
      if (status === 403 && config.url?.includes('/merchant')) {
        console.log('🔐 商户API返回 403 权限不足')
        const authStore = useAuthStore()
        
        // 检查是否是"不是本商户的订单"错误（优先处理）
        if (data?.error?.includes('不是本商户的订单') || data?.message?.includes('不是本商户的订单')) {
          // 创建一个新的错误对象，保留 response 信息，确保重试逻辑能识别
          throw buildError('不是本商户的订单！')
        }
        
        // 检查是否是商户权限问题
        if (data?.message?.includes('商户') || data?.message?.includes('绑定') || data?.message?.includes('权限')) {
          showToast('您的商户权限已被取消，请重新申请')
          // 跳转到申请页面
          if (typeof window !== 'undefined') {
            window.location.href = '/customer/merchant-binding'
          }
          throw buildError('商户权限已被取消')
        }
      }

      // 认证失败处理
      if (status === 401) {
        console.log('🔐 API 返回 401 未授权')
        
        // 🔥 修复：定义"容错接口"，这些接口的 401 错误不应该导致清除 token
        const tolerantEndpoints = [
          '/auth/current-user',    // 获取当前用户信息
          '/auth/user-info',       // 获取用户信息
          '/auth/stats',           // 用户统计数据
          '/user/profile',         // 用户资料
          '/user/stats',           // 用户统计
          '/merchant-operators/my-status'  // 商户绑定状态查询
        ]
        
        const isTolerantEndpoint = tolerantEndpoints.some(endpoint => 
          config.url?.includes(endpoint)
        )
        
        // 如果是容错接口，只记录错误，不触发重新登录或清除 token
        if (isTolerantEndpoint) {
          console.warn('⚠️ 容错接口返回 401，不触发重新登录:', config.url)
          throw buildError('获取用户信息失败，请稍后重试')
        }
        
        console.log('🔐 关键接口返回 401，尝试请求小程序重新登录')
        
        const authStore = useAuthStore()
        
        // 如果不是刷新token的请求，尝试请求小程序重新登录
        if (!config.url?.includes('/auth/refresh') && !config.url?.includes('/auth/silent-login')) {
          try {
            console.log('📱 通过 WebView Bridge 请求小程序重新登录')
            
            // 检查是否在微信小程序环境中
            if (typeof window !== 'undefined' && window.wx?.miniProgram) {
              try {
                // 通过 webview bridge 请求小程序重新登录
                const result = await webViewBridge.login()
                
                if (result && result.token) {
                  console.log('✅ 小程序重新登录成功，更新 token')
                  
                  // 更新 auth store
                  authStore.token = result.token
                  if (result.userInfo) {
                    authStore.user = result.userInfo
                  }
                  // 保存到 localStorage
                  authStore.updateTokens({ token: result.token, refreshToken: authStore.refreshToken })
                  
                  // 使用新 token 重试原请求
                  config.headers.Authorization = `Bearer ${result.token}`
                  return instance.request(config)
                }
              } catch (loginError) {
            console.error('❌ 小程序重新登录失败:', loginError)
              }
            }
            
            // 登录失败或不在小程序环境，清除认证信息
            console.log('🗑️ 清除本地认证信息')
            authStore.clearAuth()
            
            // 开发环境：如果不在小程序环境，跳转到登录页
            // 生产环境：不跳转，保持小程序登录流程
            const isDevelopment = process.env.NODE_ENV === 'development'
            if (isDevelopment && (typeof window === 'undefined' || !window.wx?.miniProgram)) {
              window.location.href = '/login'
            } else if (!isDevelopment) {
              // 生产环境：在小程序环境中，可能需要重新加载页面以触发登录流程
              console.warn('⚠️ Token 失效，但无法重新登录')
            }
          } catch (error) {
            console.error('❌ 处理 401 错误失败:', error)
            authStore.clearAuth()
            // 开发环境才跳转登录页
            const isDevelopment = process.env.NODE_ENV === 'development'
            if (isDevelopment && typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          }
        } else {
          // 刷新token请求失败，清除认证信息
          const authStore = useAuthStore()
          authStore.clearAuth()
        }
      }

      // 服务器错误处理
      if (status >= 500) {
        throw buildError('服务器内部错误，请稍后重试')
      }

      // 业务错误处理（4xx）
      const errorMessage = data.message || data.error || '请求失败'
      throw buildError(errorMessage)
    }
  )

  return instance
}

// 重试机制
const retryRequest = async (fn: () => Promise<AxiosResponse>, retries: number = 0): Promise<AxiosResponse> => {
  try {
    return await fn()
  } catch (error: any) {
    // 不重试以下错误（业务错误，重试无意义）：
    // 1. 403 错误（权限错误，包括"不是本商户的订单"）
    // 2. 401 错误（认证错误）
    // 3. 400 错误（参数错误）
    // 4. 404 错误（资源不存在）
    if (error.response) {
      const status = error.response.status
      if ([400, 401, 403, 404].includes(status)) {
        console.log(`🚫 不重试 ${status} 错误:`, error.message || error.response.data?.error || error.response.data?.message)
        throw error
      }
    }
    
    // 如果错误消息明确表示是业务错误，也不重试
    const errorMessage = error.message || ''
    if (errorMessage.includes('不是本商户的订单') || 
        errorMessage.includes('商户权限已被取消') ||
        errorMessage.includes('权限不足')) {
      console.log(`🚫 不重试业务错误:`, errorMessage)
      throw error
    }
    
    if (retries >= MAX_RETRIES) {
      throw error
    }

    console.warn(`Retrying request (${retries + 1}/${MAX_RETRIES})...`)
    await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))

    return retryRequest(fn, retries + 1)
  }
}

// 🔥 修复循环依赖：延迟创建 apiClient，避免在 BaseApiService 定义时访问
let _apiClient: AxiosInstance | null = null

// 延迟获取 apiClient 的函数
function getApiClient(): AxiosInstance {
  if (!_apiClient) {
    _apiClient = createApiInstance()
  }
  return _apiClient
}

// 基础API类
export class BaseApiService {
  protected client: AxiosInstance

  constructor(client?: AxiosInstance) {
    // 延迟获取 apiClient，避免循环依赖
    if (client) {
      this.client = client
    } else {
      // 使用 getter 延迟访问 apiClient
      this.client = getApiClient()
    }
  }

  // GET请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // 确保 params 中的值不会被过滤（包括 false 和空字符串）
    if (config?.params) {
      // 使用 paramsSerializer 确保所有参数都被正确序列化
      // axios 的 paramsSerializer 可以是函数或对象
      config.paramsSerializer = (params: any) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value))
          }
        })
        return searchParams.toString()
      }
    }
    const response = await retryRequest(() =>
      this.client.get<ApiResponse<T>>(url, config)
    )
    return response.data.data
  }

  // POST请求
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await retryRequest(() =>
      this.client.post<ApiResponse<T>>(url, data, config)
    )
    return response.data.data
  }

  // PUT请求
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await retryRequest(() =>
      this.client.put<ApiResponse<T>>(url, data, config)
    )
    return response.data.data
  }

  // PATCH请求
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await retryRequest(() =>
      this.client.patch<ApiResponse<T>>(url, data, config)
    )
    return response.data.data
  }

  // DELETE请求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await retryRequest(() =>
      this.client.delete<ApiResponse<T>>(url, config)
    )
    return response.data.data
  }

  // 文件上传
  async upload<T>(url: string, file: File, additionalData?: any): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value as string)
      })
    }

    const response = await retryRequest(() =>
      this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    )

    return response.data.data
  }
}

// 通用API客户端（延迟创建，避免循环依赖）
export const apiClient = getApiClient()

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 错误处理工具类
export class ApiErrorHandler {
  static handleApiError(error: any): string {
    if (error.response) {
      // 服务器响应的错误
      const status = error.response.status
      const data = error.response.data

      // 优先使用 API 返回的错误信息（error 或 message 字段）
      if (data?.error) {
        return data.error
      }
      if (data?.message) {
        return data.message
      }

      switch (status) {
        case 400:
          return '请求参数错误'
        case 401:
          return '登录已过期，请重新登录'
        case 403:
          return '权限不足，无法访问'
        case 404:
          return '请求的资源不存在'
        case 422:
          return data.message || '数据验证失败'
        case 429:
          return '请求过于频繁，请稍后重试'
        case 500:
          return '服务器内部错误'
        default:
          return data.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有响应
      return '网络连接失败，请检查网络设置'
    } else {
      // 请求配置错误
      return error.message || '请求失败'
    }
  }
}

// 请求取消控制器
export const createAbortController = () => {
  return new AbortController()
}

// 导出单例实例
export const api = new BaseApiService()