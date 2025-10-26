/**
 * 微信小程序 WebView 通讯桥接工具
 * 用于处理 Vue 应用与微信小程序之间的通讯
 */

export interface WebViewMessage {
  type: string
  data?: any
  id?: string
  timestamp?: number
}

export interface WebViewResponse {
  type: string
  data: any
  success: boolean
  msgId?: string
}

class WebViewBridge {
  private messageHandlers = new Map<string, Function[]>()
  private pendingMessages = new Map<string, {
    resolve: Function
    reject: Function
    timeout: ReturnType<typeof setTimeout>
  }>()
  private isInMiniProgram = false

  constructor() {
    this.init()
  }

  /**
   * 初始化 WebView 桥接
   */
  private init() {
    // 检查是否在微信小程序环境中
    if (typeof window !== 'undefined' && window.wx?.miniProgram) {
      window.wx.miniProgram.getEnv?.((res: { miniprogram: boolean }) => {
        this.isInMiniProgram = res.miniprogram
        if (this.isInMiniProgram) {
          console.log('✅ 检测到微信小程序环境，初始化 WebView Bridge')
          this.setupMessageListener()
        }
      })
    }

    // 监听来自小程序的消息
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMiniProgramMessage.bind(this))
    }
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener() {
    console.log('🔗 WebView Bridge 消息监听器已设置')
  }

  /**
   * 处理来自小程序的消息
   */
  private handleMiniProgramMessage(event: MessageEvent) {
    try {
      const message = event.data
      if (!message || typeof message !== 'object') {
        return
      }

      console.log('📨 收到来自小程序的消息:', message)

      // 处理响应消息（有 msgId 的是响应消息）
      if (message.msgId && this.pendingMessages.has(message.msgId)) {
        const { resolve, reject, timeout } = this.pendingMessages.get(message.msgId)!
        clearTimeout(timeout as any)
        this.pendingMessages.delete(message.msgId)

        if (message.success) {
          resolve(message.data)
        } else {
          reject(new Error(message.errMsg || '操作失败'))
        }
        return
      }

      // 处理请求消息
      if (message.type) {
        this.emit(message.type, message.data)
      }
    } catch (error) {
      console.error('❌ 处理小程序消息失败:', error)
    }
  }

  /**
   * 发送消息到小程序
   */
  public sendMessage(type: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isInMiniProgram) {
        console.warn('⚠️ 不在微信小程序环境中，无法发送消息')
        resolve(null)
        return
      }

      const messageId = this.generateMessageId()
      const message: WebViewMessage = {
        type,
        data,
        id: messageId,
        timestamp: Date.now()
      }

      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(messageId)
        reject(new Error('消息发送超时'))
      }, 10000)

      this.pendingMessages.set(messageId, { resolve, reject, timeout })

      try {
        console.log('📤 发送消息到小程序:', message)
        window.wx?.miniProgram?.postMessage?.(message)
      } catch (error) {
        clearTimeout(timeout)
        this.pendingMessages.delete(messageId)
        reject(error)
      }
    })
  }

  /**
   * 监听特定类型的消息
   */
  public on(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(handler)
    console.log(`🔧 注册消息处理器: ${type}`)
  }

  /**
   * 移除消息监听器
   */
  public off(type: string, handler?: Function) {
    if (!this.messageHandlers.has(type)) {
      return
    }

    if (handler) {
      const handlers = this.messageHandlers.get(type)!
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    } else {
      this.messageHandlers.delete(type)
    }
  }

  /**
   * 触发事件处理器
   */
  private emit(type: string, data?: any) {
    const handlers = this.messageHandlers.get(type)
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`❌ 消息处理器执行失败 [${type}]:`, error)
        }
      })
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `vue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取 mall_token
   */
  public async getMallToken(): Promise<{ token: string; user: any }> {
    try {
      console.log('🔐 请求获取 mall_token...')
      const result = await this.sendMessage('getMallToken')
      console.log('✅ 获取 mall_token 成功:', result)
      return result
    } catch (error) {
      console.error('❌ 获取 mall_token 失败:', error)
      throw error
    }
  }

  /**
   * 请求登录
   */
  public async login(): Promise<{ token: string; userInfo: any }> {
    try {
      console.log('🔐 请求微信登录...')
      const result = await this.sendMessage('login')
      console.log('✅ 登录成功:', result)
      return result
    } catch (error) {
      console.error('❌ 登录失败:', error)
      throw error
    }
  }

  /**
   * 获取用户信息
   */
  public async getUserInfo(): Promise<any> {
    try {
      console.log('👤 请求获取用户信息...')
      const result = await this.sendMessage('getUserInfo')
      console.log('✅ 获取用户信息成功:', result)
      return result
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error)
      throw error
    }
  }

  /**
   * 获取位置信息
   */
  public async getLocation(): Promise<{ latitude: number; longitude: number; address?: string }> {
    try {
      console.log('📍 请求获取位置信息...')
      const result = await this.sendMessage('getLocation')
      console.log('✅ 获取位置信息成功:', result)
      return result
    } catch (error) {
      console.error('❌ 获取位置信息失败:', error)
      throw error
    }
  }

  /**
   * 分享内容
   */
  public async share(data: {
    title: string
    desc?: string
    path?: string
    imageUrl?: string
  }): Promise<boolean> {
    try {
      console.log('📤 请求分享:', data)
      await this.sendMessage('share', data)
      console.log('✅ 分享设置成功')
      return true
    } catch (error) {
      console.error('❌ 分享失败:', error)
      throw error
    }
  }

  /**
   * 发起支付
   */
  public async payment(data: {
    orderId: string
    amount: number
    description: string
  }): Promise<boolean> {
    try {
      console.log('💰 请求支付:', data)
      await this.sendMessage('payment', data)
      console.log('✅ 支付成功')
      return true
    } catch (error) {
      console.error('❌ 支付失败:', error)
      throw error
    }
  }

  /**
   * 显示 Toast
   */
  public showToast(data: {
    title: string
    icon?: 'success' | 'error' | 'loading' | 'none'
    duration?: number
  }): Promise<void> {
    return this.sendMessage('showToast', data)
  }

  /**
   * 显示 Modal
   */
  public async showModal(data: {
    title: string
    content: string
    showCancel?: boolean
    cancelText?: string
    confirmText?: string
  }): Promise<{ confirm: boolean }> {
    try {
      const result = await this.sendMessage('showModal', data)
      return result
    } catch (error) {
      console.error('❌ 显示模态框失败:', error)
      throw error
    }
  }

  /**
   * 清理资源
   */
  public destroy() {
    this.messageHandlers.clear()

    this.pendingMessages.forEach(({ timeout }) => {
      clearTimeout(timeout as any)
    })
    this.pendingMessages.clear()

    console.log('🧹 WebView Bridge 已清理')
  }
}

// 创建单例实例
export const webViewBridge = new WebViewBridge()

export default webViewBridge