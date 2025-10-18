import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppVersion } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 状态
  const currentVersion = ref<AppVersion>('customer')
  const isOnline = ref<boolean>(true)
  const isLoading = ref<boolean>(false)
  const error = ref<any>(null)
  const systemInfo = ref({
    isWechatMiniProgram: false,
    isWechatBrowser: false,
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    userAgent: '',
    viewport: {
      width: 0,
      height: 0
    }
  })

  // 计算属性
  const isMerchantMode = computed(() => currentVersion.value === 'merchant')
  const isCustomerMode = computed(() => currentVersion.value === 'customer')

  // 切换到商户版
  const switchToMerchant = () => {
    currentVersion.value = 'merchant'
    localStorage.setItem('appVersion', 'merchant')
  }

  // 切换到客户版
  const switchToCustomer = () => {
    currentVersion.value = 'customer'
    localStorage.setItem('appVersion', 'customer')
  }

  // 切换版本
  const switchVersion = (version: AppVersion) => {
    if (version === 'merchant') {
      switchToMerchant()
    } else {
      switchToCustomer()
    }
  }

  // 检测环境信息
  const detectEnvironment = () => {
    const userAgent = navigator.userAgent
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    systemInfo.value = {
      isWechatMiniProgram: typeof wx !== 'undefined' && wx.miniProgram,
      isWechatBrowser: /MicroMessenger/i.test(userAgent),
      isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/i.test(userAgent),
      isAndroid: /Android/i.test(userAgent),
      userAgent: userAgent,
      viewport: viewport
    }

    return systemInfo.value
  }

  // 检查网络状态
  const checkNetworkStatus = () => {
    const handleOnline = () => {
      isOnline.value = true
      error.value = null
    }

    const handleOffline = () => {
      isOnline.value = false
      error.value = { message: '网络连接已断开' }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return {
      removeListeners: () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }

  // 设置加载状态
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  // 设置错误
  const setError = (err: any) => {
    error.value = err
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 初始化应用
  const initializeApp = async () => {
    try {
      // 检测环境
      detectEnvironment()

      // 检查网络状态
      checkNetworkStatus()

      // 从本地存储恢复版本设置
      const savedVersion = localStorage.getItem('appVersion') as AppVersion
      if (savedVersion && (savedVersion === 'customer' || savedVersion === 'merchant')) {
        currentVersion.value = savedVersion
      }

      // 检查微信小程序参数
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      const version = urlParams.get('version')

      if (version && (version === 'customer' || version === 'merchant')) {
        currentVersion.value = version
        localStorage.setItem('appVersion', version)
      }

      return { success: true, message: '应用初始化成功' }
    } catch (error) {
      console.error('应用初始化失败:', error)
      return { success: false, message: '应用初始化失败' }
    }
  }

  // 清理资源
  const cleanup = () => {
    // 移除事件监听器
    // 清除定时器
    // 其他清理工作
  }

  return {
    // 状态
    currentVersion,
    isOnline,
    isLoading,
    error,
    systemInfo,

    // 计算属性
    isMerchantMode,
    isCustomerMode,

    // 方法
    switchToMerchant,
    switchToCustomer,
    switchVersion,
    detectEnvironment,
    checkNetworkStatus,
    setLoading,
    setError,
    clearError,
    initializeApp,
    cleanup
  }
})