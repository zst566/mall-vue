import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/services/api'

interface WechatParams {
  token?: string;
  refreshToken?: string;
  userId?: string;
  from?: string;
  scene?: string;
  timestamp?: number;
  signature?: string;
  appid?: string;
  openid?: string;
  unionid?: string;
  [key: string]: any;
}

interface TokenManager {
  isRefreshing: boolean;
  refreshPromise: Promise<string> | null;
  refreshCount: number;
  maxRefreshCount: number;
  refreshInterval: number;
  lastRefreshTime: number;
}

// 微信小程序参数处理
export function useWechatParams() {
  const router = useRouter()
  const authStore = useAuthStore()

  const wechatParams = ref<WechatParams>({})
  const paramsLoaded = ref(false)
  const error = ref<string | null>(null)

  // Token管理器状态
  const tokenManager: TokenManager = {
    isRefreshing: false,
    refreshPromise: null,
    refreshCount: 0,
    maxRefreshCount: 3,
    refreshInterval: 60000, // 1分钟
    lastRefreshTime: 0
  }

  // 检查是否在微信小程序环境
  const isWechatMiniProgram = () => {
    return typeof window !== 'undefined' &&
           window.wx &&
           typeof window.wx.miniProgram === 'object'
  }

  // 检查是否在微信浏览器环境
  const isWechatBrowser = () => {
    const ua = navigator.userAgent.toLowerCase()
    return ua.includes('micromessenger')
  }

  // 从URL参数中解析微信参数
  const parseWechatParamsFromUrl = (): WechatParams => {
    try {
      const params: WechatParams = {}
      const urlParams = new URLSearchParams(window.location.search)

      // 常见的微信小程序传递参数（包括 mall_token）
      const wechatParamKeys = [
        'token', 'mall_token', 'refreshToken', 'userId', 'user_id', 'from', 'scene',
        'timestamp', 'signature', 'appid', 'openid', 'unionid'
      ]

      wechatParamKeys.forEach(key => {
        const value = urlParams.get(key)
        if (value) {
          // 处理不同的数据类型
          if (key === 'timestamp' || key === 'scene') {
            params[key] = parseInt(value, 10) as any
          } else {
            params[key] = value
          }
        }
      })

      return params
    } catch (err) {
      console.error('Failed to parse wechat params:', err)
      return {}
    }
  }

  // 从window对象获取微信参数（小程序web-view环境）
  const getWechatParamsFromWindow = (): WechatParams => {
    try {
      const params: WechatParams = {}

      // 微信小程序web-view环境下的参数
      if (window.wx && window.wx.miniProgram) {
        // 尝试获取小程序传递的参数
        Object.assign(params, window.__wxConfig || {})
        try {
          window.wx.miniProgram.getEnv?.((env: any) => {
            if (env) {
              Object.assign(params, env)
            }
          })
        } catch (e) {
          // 忽略错误
        }
      }

      // 从localStorage获取持久化的参数
      const savedParams = localStorage.getItem('wechat_params')
      if (savedParams) {
        Object.assign(params, JSON.parse(savedParams))
      }

      return params
    } catch (err) {
      console.error('Failed to get wechat params from window:', err)
      return {}
    }
  }

  // 从URL hash中解析参数
  const parseParamsFromHash = (): WechatParams => {
    try {
      const params: WechatParams = {}
      const hash = window.location.hash.substring(1)

      if (hash) {
        const urlParams = new URLSearchParams(hash)
        const keys = ['token', 'refreshToken', 'userId', 'from', 'scene']

        keys.forEach(key => {
          const value = urlParams.get(key)
          if (value) {
            params[key] = value
          }
        })
      }

      return params
    } catch (err) {
      console.error('Failed to parse params from hash:', err)
      return {}
    }
  }

  // 加载微信参数
  const loadWechatParams = async (): Promise<void> => {
    try {
      error.value = null
      let finalParams: WechatParams = {}

      // 按优先级加载参数
      if (isWechatMiniProgram() || isWechatBrowser()) {
        // 微信环境优先从window对象获取
        finalParams = getWechatParamsFromWindow()

        // 然后从URL获取
        const urlParams = parseWechatParamsFromUrl()
        Object.assign(finalParams, urlParams)
      } else {
        // 普通浏览器环境
        finalParams = parseWechatParamsFromUrl()

        // 检查hash参数
        const hashParams = parseParamsFromHash()
        Object.assign(finalParams, hashParams)
      }

      // 过滤空值
      Object.keys(finalParams).forEach(key => {
        if (finalParams[key] === undefined || finalParams[key] === null) {
          delete finalParams[key]
        }
      })

      wechatParams.value = finalParams
      paramsLoaded.value = true

      console.log('WeChat params loaded:', finalParams)

      // 处理 mall_token（小程序传递的 token）
      if (finalParams.mall_token && !finalParams.token) {
        console.log('📱 检测到 mall_token，自动映射为 token')
        finalParams.token = finalParams.mall_token
      }
      
      // 处理 user_id
      if (finalParams.user_id && !finalParams.userId) {
        console.log('📱 检测到 user_id，自动映射为 userId')
        finalParams.userId = finalParams.user_id
      }

      // 如果有token，自动登录
      if (finalParams.token) {
        console.log('🔐 检测到 token，开始自动登录...')
        await autoLogin(finalParams.token, finalParams.refreshToken)
      } else {
        console.log('⚠️  未检测到 token，跳过自动登录')
      }

    } catch (err) {
      error.value = '加载微信参数失败: ' + (err as Error).message
      console.error('Failed to load wechat params:', err)
    }
  }

  // 自动登录
  const autoLogin = async (token: string, refreshToken?: string): Promise<void> => {
    try {
      const authStore = useAuthStore()

      // 模拟API调用验证token
      // 实际项目中应该调用 /auth/validate-token 接口
      const isValid = await validateToken(token)

      if (isValid) {
        authStore.setAuth({
          token,
          refreshToken: refreshToken || '',
          user: await getUserInfo()
        })
      } else {
        // token无效，清除本地数据
        authStore.clearAuth()
        throw new Error('Token无效或已过期')
      }
    } catch (err) {
      console.error('Auto login failed:', err)
      // 即使自动登录失败，也不阻塞用户手动登录
    }
  }

  // 验证token
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // 调用后端API验证token
      const response = await apiClient.get('/auth/validate-token', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.valid
    } catch (err) {
      console.error('Token validation failed:', err)
      return false
    }
  }

  // 获取用户信息
  const getUserInfo = async (): Promise<any> => {
    try {
      // 调用后端API获取用户信息
      const response = await apiClient.get('/user/profile')
      return response.data
    } catch (err) {
      console.error('Failed to get user info:', err)
      throw err
    }
  }

  // 保存微信参数
  const saveWechatParams = (params: WechatParams): void => {
    try {
      localStorage.setItem('wechat_params', JSON.stringify(params))

      // 更新当前参数
      Object.assign(wechatParams.value, params)
    } catch (err) {
      console.error('Failed to save wechat params:', err)
    }
  }

  // 清除微信参数
  const clearWechatParams = (): void => {
    try {
      localStorage.removeItem('wechat_params')
      wechatParams.value = {}
    } catch (err) {
      console.error('Failed to clear wechat params:', err)
    }
  }

  // 检查参数完整性
  const checkParamsIntegrity = (): boolean => {
    const required = ['token', 'userId']
    return required.every(key => wechatParams.value[key])
  }

  // 监听URL变化
  let urlChangeListener: EventListener | null = null

  const setupUrlChangeListener = () => {
    urlChangeListener = () => {
      loadWechatParams()
    }

    window.addEventListener('hashchange', urlChangeListener)
    window.addEventListener('popstate', urlChangeListener)
  }

  // 清理监听器
  const cleanupUrlListeners = () => {
    if (urlChangeListener) {
      window.removeEventListener('hashchange', urlChangeListener)
      window.removeEventListener('popstate', urlChangeListener)
      urlChangeListener = null
    }
  }

  // 组件挂载时加载参数（只在组件内部调用）
  const initializeLifecycle = () => {
    onMounted(() => {
      loadWechatParams()
      setupUrlChangeListener()
    })

    // 组件卸载时清理
    onUnmounted(() => {
      cleanupUrlListeners()
    })
  }

  return {
    wechatParams,
    paramsLoaded,
    error,
    isWechatMiniProgram,
    isWechatBrowser,
    loadWechatParams,
    saveWechatParams,
    clearWechatParams,
    checkParamsIntegrity,
    initializeLifecycle
  }
}

// Token管理器
export class TokenRefreshManager {
  private static instance: TokenRefreshManager | null = null
  private timerId: number | null = null
  private callbacks: Set<() => void> = new Set()

  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager()
    }
    return TokenRefreshManager.instance
  }

  // 开始监控token过期时间
  startMonitoring(token: string): void {
    const authStore = useAuthStore()
    const tokenExpireTime = this.getTokenExpireTime(token)

    if (tokenExpireTime) {
      const timeUntilExpire = tokenExpireTime - Date.now()

      // 设置提前刷新的时间（过期前10分钟）
      const refreshTime = Math.max(0, timeUntilExpire - 10 * 60 * 1000)

      this.timerId = window.setTimeout(() => {
        this.refreshToken()
      }, refreshTime)
    }
  }

  // 停止监控
  stopMonitoring(): void {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.callbacks.clear()
  }

  // 刷新token
  async refreshToken(): Promise<boolean> {
    const authStore = useAuthStore()

    if (authStore.refreshToken) {
      try {
        // 这里应该调用refresh token接口
        // const response = await api.post('/auth/refresh', {
        //   refreshToken: authStore.refreshToken
        // })

        // 模拟刷新成功
        const newToken = 'new_refreshed_token_' + Date.now()
        authStore.updateTokens({
          token: newToken,
          refreshToken: authStore.refreshToken
        })

        // 重新开始监控
        this.startMonitoring(newToken)

        return true
      } catch (err) {
        console.error('Token refresh failed:', err)
        return false
      }
    }

    return false
  }

  // 获取token过期时间
  private getTokenExpireTime(token: string): number | null {
    try {
      // 这里应该解析JWT token获取过期时间
      // const payload = this.parseJWT(token)
      // return payload.exp * 1000

      // 模拟2小时后过期
      return Date.now() + 2 * 60 * 60 * 1000
    } catch (err) {
      console.error('Failed to parse token expire time:', err)
      return null
    }
  }

  // 添加回调函数
  addCallback(callback: () => void): void {
    this.callbacks.add(callback)
  }

  // 移除回调函数
  removeCallback(callback: () => void): void {
    this.callbacks.delete(callback)
  }
}

// 导出token管理器实例
export const tokenManager = TokenRefreshManager.getInstance()