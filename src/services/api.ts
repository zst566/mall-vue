import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, ApiError } from '@/types'

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
    (config) => {
      const authStore = useAuthStore()

      // 添加认证token
      if (authStore.isAuthenticated) {
        config.headers.Authorization = `Bearer ${authStore.token}`
      }

      // 添加请求ID用于追踪
      config.headers['X-Request-ID'] = generateRequestId()

      console.log(`[${config.method?.toUpperCase()}] ${config.url}`, {
        params: config.params,
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

      // 网络错误处理
      if (!error.response) {
        console.error(`[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - Network Error`, error.message)
        throw new Error('网络连接失败，请检查网络设置')
      }

      const { status, data } = error.response

      // 错误日志记录
      console.error(`[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - ${status}`, {
        error: data,
        headers: error.response.headers
      })

      // 认证失败处理
      if (status === 401) {
        const authStore = useAuthStore()
        authStore.clearAuth()

        // 如果不是刷新token的请求，跳转到登录页
        if (!config.url.includes('/auth/refresh')) {
          window.location.href = '/login'
        }
      }

      // 服务器错误处理
      if (status >= 500) {
        throw new Error('服务器内部错误，请稍后重试')
      }

      // 业务错误处理
      const errorMessage = data.message || data.error || '请求失败'
      throw new Error(errorMessage)
    }
  )

  return instance
}

// 重试机制
const retryRequest = async (fn: () => Promise<AxiosResponse>, retries: number = 0): Promise<AxiosResponse> => {
  try {
    return await fn()
  } catch (error) {
    if (retries >= MAX_RETRIES) {
      throw error
    }

    console.warn(`Retrying request (${retries + 1}/${MAX_RETRIES})...`)
    await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))

    return retryRequest(fn, retries + 1)
  }
}

// 通用API客户端
export const apiClient = createApiInstance()

// 基础API类
export class BaseApiService {
  protected client: AxiosInstance

  constructor(client?: AxiosInstance) {
    this.client = client || apiClient
  }

  // GET请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
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

      switch (status) {
        case 400:
          return data.message || '请求参数错误'
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