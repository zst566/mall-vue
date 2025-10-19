// 微信环境检测工具类
export class WechatEnvironment {
  private static instance: WechatEnvironment | null = null

  static getInstance(): WechatEnvironment {
    if (!WechatEnvironment.instance) {
      WechatEnvironment.instance = new WechatEnvironment()
    }
    return WechatEnvironment.instance
  }

  // 检测当前环境
  detectEnvironment(): {
    isWeChat: boolean
    isMiniProgram: boolean
    isMobile: boolean
    isAndroid: boolean
    isIOS: boolean
    browser: string
    version: string
    os: string
    deviceType: 'mobile' | 'tablet' | 'desktop'
  } {
    const userAgent = navigator.userAgent.toLowerCase()
    const ua = userAgent

    // 检测是否是微信浏览器
    const isWeChat = /micromessenger/.test(ua)

    // 检测是否是微信小程序环境
    const isMiniProgram = isWeChat && this.hasWechatMiniProgramAPI()

    // 检测设备类型
    const isMobile = /mobile|android|iphone|ipod|ipad/.test(ua)
    const isAndroid = /android/.test(ua)
    const isIOS = /iphone|ipad|ipod/.test(ua)

    // 检测操作系统
    let os = 'unknown'
    if (isAndroid) os = 'android'
    else if (isIOS) os = 'ios'
    else if (/windows/.test(ua)) os = 'windows'
    else if (/macintosh|mac os x/.test(ua)) os = 'macos'
    else if (/linux/.test(ua)) os = 'linux'

    // 设备类型
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (isMobile && !/tablet/.test(ua)) {
      deviceType = 'mobile'
    } else if (/tablet/.test(ua)) {
      deviceType = 'tablet'
    }

    // 浏览器信息
    let browser = 'unknown'
    if (isWeChat) browser = 'wechat'
    else if (/edg/.test(ua)) browser = 'edge'
    else if (/chrome/.test(ua)) browser = 'chrome'
    else if (/safari/.test(ua)) browser = 'safari'
    else if (/firefox/.test(ua)) browser = 'firefox'
    else if (/opera/.test(ua)) browser = 'opera'

    // 版本信息
    let version = 'unknown'
    const versionMatch = ua.match(/(chrome|safari|firefox|edge|opera)[\/\s]([\d.]+)/)
    if (versionMatch) {
      version = versionMatch[2]
    }

    return {
      isWeChat,
      isMiniProgram,
      isMobile,
      isAndroid,
      isIOS,
      browser,
      version,
      os,
      deviceType
    }
  }

  // 检测是否有微信小程序API
  private hasWechatMiniProgramAPI(): boolean {
    try {
      return typeof window !== 'undefined' &&
             window.wx &&
             typeof window.wx.miniProgram === 'object' &&
             typeof window.wx.miniProgram.postMessage === 'function' &&
             typeof window.wx.miniProgram.navigateBack === 'function'
    } catch (error) {
      return false
    }
  }

  // 获取微信版本
  getWechatVersion(): string {
    const ua = navigator.userAgent.toLowerCase()
    const match = ua.match(/micromessenger\/([\d.]+)/)
    return match ? match[1] : 'unknown'
  }

  // 获取设备屏幕信息
  getScreenInfo(): {
    width: number
    height: number
    pixelRatio: number
    isPortrait: boolean
    isLandscape: boolean
    screenWidth: number
    screenHeight: number
    windowWidth: number
    windowHeight: number
    safeArea?: {
      top: number
      bottom: number
      left: number
      right: number
    }
  } {
    const pixelRatio = window.devicePixelRatio || 1
    const screenWidth = window.screen.width * pixelRatio
    const screenHeight = window.screen.height * pixelRatio
    const windowWidth = window.innerWidth * pixelRatio
    const windowHeight = window.innerHeight * pixelRatio

    // 检测横屏/竖屏
    const isPortrait = window.innerHeight > window.innerWidth
    const isLandscape = !isPortrait

    // 安全区域（针对移动设备）
    let safeArea
    if (this.detectEnvironment().isMiniProgram && window.wx) {
      try {
        const systemInfo = window.wx.getSystemInfoSync()
        if (systemInfo.safeArea) {
          safeArea = {
            top: systemInfo.safeArea.top,
            bottom: systemInfo.safeArea.bottom,
            left: systemInfo.safeArea.left,
            right: systemInfo.safeArea.right
          }
        }
      } catch (error) {
        console.warn('Failed to get safe area:', error)
      }
    }

    return {
      width: windowWidth,
      height: windowHeight,
      pixelRatio,
      isPortrait,
      isLandscape,
      screenWidth,
      screenHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      safeArea
    }
  }

  // 检测网络状态
  async checkNetworkStatus(): Promise<{
    online: boolean
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown'
    downlink: number
    rtt: number
    saveData: boolean
  }> {
    if (!navigator.connection) {
      return {
        online: navigator.onLine,
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      }
    }

    const connection = navigator.connection as any
    return {
      online: navigator.onLine,
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    }
  }

  // 检测存储支持
  checkStorageSupport(): {
    localStorage: boolean
    sessionStorage: boolean
    cookies: boolean
    indexedDB: boolean
    webSQL: boolean
  } {
    try {
      return {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        cookies: document.cookie !== '',
        indexedDB: typeof indexedDB !== 'undefined',
        webSQL: typeof openDatabase !== 'undefined'
      }
    } catch (error) {
      return {
        localStorage: false,
        sessionStorage: false,
        cookies: false,
        indexedDB: false,
        webSQL: false
      }
    }
  }

  // 检测地理位置支持
  async checkGeolocationSupport(): Promise<{
    supported: boolean
    permission: boolean
    enabled: boolean
    accuracy: number | null
  }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          supported: false,
          permission: false,
          enabled: false,
          accuracy: null
        })
        return
      }

      // 检查权限
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        const hasPermission = permissionStatus.state === 'granted' || permissionStatus.state === 'prompt'

        // 尝试获取位置信息
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              supported: true,
              permission: hasPermission,
              enabled: true,
              accuracy: position.coords.accuracy
            })
          },
          (error) => {
            resolve({
              supported: true,
              permission: hasPermission,
              enabled: false,
              accuracy: null
            })
          },
          {
            timeout: 5000,
            maximumAge: 0,
            enableHighAccuracy: true
          }
        )
      }).catch(() => {
        resolve({
          supported: true,
          permission: false,
          enabled: false,
          accuracy: null
        })
      })
    })
  }

  // 获取系统信息
  async getSystemInfo(): Promise<{
    platform: string
    platformVersion: string
    deviceModel: string
    systemVersion: string
    language: string
    theme: 'light' | 'dark' | 'auto'
    fontSize: 'standard' | 'large' | 'small'
  }> {
    const env = this.detectEnvironment()

    let theme: 'light' | 'dark' | 'auto' = 'auto'
    if (window.matchMedia) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    let fontSize: 'standard' | 'large' | 'small' = 'standard'
    if (env.isMiniProgram && window.wx) {
      try {
        const systemInfo = window.wx.getSystemInfoSync()
        fontSize = systemInfo.fontSizeLevel === 'large' ? 'large' : 'small'
      } catch (error) {
        console.warn('Failed to get font size:', error)
      }
    }

    return {
      platform: env.os,
      platformVersion: env.version,
      deviceModel: env.deviceType,
      systemVersion: env.version,
      language: navigator.language || 'zh-CN',
      theme,
      fontSize
    }
  }

  // 检测性能信息
  async getPerformanceInfo(): Promise<{
    deviceMemory: number | null
    hardwareConcurrency: number
    connection: any
    timing: {
      firstPaint: number
      firstContentfulPaint: number
      domComplete: number
      loadEventEnd: number
    }
  }> {
    const performance = (window as any).performance
    const timing = performance?.timing ? {
      firstPaint: performance.timing.responseStart,
      firstContentfulPaint: performance.timing.domInteractive,
      domComplete: performance.timing.domComplete,
      loadEventEnd: performance.timing.loadEventEnd
    } : {
      firstPaint: 0,
      firstContentfulPaint: 0,
      domComplete: 0,
      loadEventEnd: 0
    }

    const connection = await this.checkNetworkStatus()

    return {
      deviceMemory: (navigator as any).deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      connection,
      timing
    }
  }

  // 微信小程序相关方法
  miniProgram = {
    // 获取小程序信息
    getInfo: async () => {
      if (!this.detectEnvironment().isMiniProgram) {
        throw new Error('Not in WeChat mini-program environment')
      }

      const systemInfo = (window.wx as any).getSystemInfoSync()
      return {
        appId: systemInfo.appId,
        version: systemInfo.version,
        SDKVersion: systemInfo.SDKVersion,
        language: systemInfo.language,
        platform: systemInfo.platform,
        pixelRatio: systemInfo.pixelRatio,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight,
        windowWidth: systemInfo.windowWidth,
        windowHeight: systemInfo.windowHeight,
        statusBarHeight: systemInfo.statusBarHeight,
        safeArea: systemInfo.safeArea,
        safeAreaInsets: systemInfo.safeAreaInsets
      }
    },

    // 账号信息
    account: {
      // 获取登录凭证
      getLoginCode: async () => {
        if (!this.detectEnvironment().isMiniProgram) {
          throw new Error('Not in WeChat mini-program environment')
        }

        return new Promise((resolve, reject) => {
          (window.wx as any).login({
            success: resolve,
            fail: reject
          })
        })
      },

      // 获取用户信息
      getUserInfo: async (withCredentials = false) => {
        if (!this.detectEnvironment().isMiniProgram) {
          throw new Error('Not in WeChat mini-program environment')
        }

        return new Promise((resolve, reject) => {
          (window.wx as any).getUserInfo({
            withCredentials,
            success: resolve,
            fail: reject
          })
        })
      }
    },

    // 支付相关
    payment: {
      // 发起支付
      request: async (payRequest: any) => {
        if (!this.detectEnvironment().isMiniProgram) {
          throw new Error('Not in WeChat mini-program environment')
        }

        return new Promise((resolve, reject) => {
          (window.wx as any).requestPayment({
            ...payRequest,
            success: resolve,
            fail: reject
          })
        })
      }
    },

    // 分享功能
    share: {
      // 设置分享
      setShareData: (data: {
        title: string
        path: string
        imageUrl?: string
      }) => {
        if (this.detectEnvironment().isMiniProgram) {
          (window.wx as any).updateShareMenu({
            withShareTicket: true,
            menus: [{
              title: data.title,
              path: data.path,
              imageUrl: data.imageUrl
            }]
          })
        }
      }
    },

    // 扫码
    scan: {
      // 扫描二维码
      scanCode: async () => {
        if (!this.detectEnvironment().isMiniProgram) {
          throw new Error('Not in WeChat mini-program environment')
        }

        return new Promise((resolve, reject) => {
          (window.wx as any).scanCode({
            success: (res: any) => resolve(res.result),
            fail: reject
          })
        })
      }
    }
  }

  // 工具方法
  utils = {
    // 生成设备ID
    generateDeviceId: (): string => {
      const env = WechatEnvironment.getInstance().detectEnvironment()
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      return `${env.browser}_${env.os}_${timestamp}_${random}`
    },

    // 防抖函数
    debounce: (func: Function, delay: number) => {
      let timeout: NodeJS.Timeout
      return (...args: any[]) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(null, args), delay)
      }
    },

    // 节流函数
    throttle: (func: Function, delay: number) => {
      let lastCall = 0
      return (...args: any[]) => {
        const now = Date.now()
        if (now - lastCall >= delay) {
          lastCall = now
          func.apply(null, args)
        }
      }
    },

    // 检查是否是iOS
    isIOS: (): boolean => {
      return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    },

    // 检查是否是Android
    isAndroid: (): boolean => {
      return /android/.test(navigator.userAgent.toLowerCase())
    },

    // 检查是否是移动设备
    isMobile: (): boolean => {
      return /mobile|android|iphone|ipod|ipad/.test(navigator.userAgent.toLowerCase())
    }
  }
}

// 导出单例实例
export const wechatEnv = WechatEnvironment.getInstance()

// 导出快捷方法
export const detectWechatEnvironment = () => wechatEnv.detectEnvironment()
export const checkWeChatMiniProgram = () => wechatEnv.detectEnvironment().isMiniProgram
export const getWechatScreenInfo = () => wechatEnv.getScreenInfo()
export const getSystemInfo = () => wechatEnv.getSystemInfo()