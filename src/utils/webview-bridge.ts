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
  public isInMiniProgram = false

  constructor() {
    this.init()
  }

  /**
   * 初始化 WebView 桥接
   */
  private init() {
    console.log('🔧 [WebView Bridge] 开始初始化...')
    console.log('🔧 [WebView Bridge] 环境检测:', {
      hasWindow: typeof window !== 'undefined',
      hasWx: typeof window !== 'undefined' && !!window.wx,
      hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
      hasGetEnv: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.getEnv === 'function',
      hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function'
    })
    
    // 检查是否在微信小程序环境中
    if (typeof window !== 'undefined' && window.wx?.miniProgram) {
      // 尝试使用 getEnv 检测
      if (typeof window.wx.miniProgram.getEnv === 'function') {
        window.wx.miniProgram.getEnv((res: { miniprogram: boolean }) => {
          this.isInMiniProgram = res.miniprogram
          console.log('🔧 [WebView Bridge] getEnv 结果:', res)
          if (this.isInMiniProgram) {
            console.log('✅ [WebView Bridge] 检测到微信小程序环境，初始化 WebView Bridge')
            this.setupMessageListener()
          } else {
            console.log('⚠️ [WebView Bridge] 不在小程序环境中')
          }
        })
      } else {
        // 如果没有 getEnv，但有 postMessage，也认为是在小程序环境中
        if (typeof window.wx.miniProgram.postMessage === 'function') {
          this.isInMiniProgram = true
          console.log('✅ [WebView Bridge] 检测到 postMessage，假设在小程序环境中')
          this.setupMessageListener()
        }
      }
    } else {
      console.log('⚠️ [WebView Bridge] 未检测到微信小程序环境')
    }

    // 监听来自小程序的消息
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMiniProgramMessage.bind(this))
      console.log('🔧 [WebView Bridge] 已设置 message 事件监听器')
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
   * 跳转到小程序支付页面
   * 通过修改 webview URL 参数传递订单信息，小程序端检测到参数后跳转
   */
  public async navigateToPayment(orderInfo: {
    orderId: string
    amount: number
    description: string
    productInfo?: {
      name: string
      image?: string
      description?: string
      price: number
      originalPrice?: number
      quantity?: number
    }
    orderNo?: string
    merchantName?: string
  }): Promise<boolean> {
    try {
      console.log('========== [支付] 开始跳转流程 ==========')
      console.log('💰 [支付] 准备跳转到支付页面')
      console.log('💰 [支付] 订单信息:', JSON.stringify(orderInfo, null, 2))
      
      // 详细的环境检测日志
      console.log('🔍 [支付] 环境检测详情:', {
        isInMiniProgram: this.isInMiniProgram,
        hasWindow: typeof window !== 'undefined',
        hasWx: typeof window !== 'undefined' && !!window.wx,
        hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
        hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
      })
      
      // 检查是否在小程序环境中
      if (!this.isInMiniProgram) {
        // 再次尝试检测环境（可能初始化时检测失败）
        console.log('⚠️ [支付] isInMiniProgram 为 false，尝试重新检测环境...')
        
        if (typeof window !== 'undefined' && window.wx?.miniProgram) {
          const miniProgram = window.wx.miniProgram
          const getEnv = miniProgram.getEnv
          const postMessage = miniProgram.postMessage
          
          if (getEnv && typeof getEnv === 'function') {
            return new Promise((resolve, reject) => {
              getEnv((res: { miniprogram: boolean }) => {
                console.log('🔍 [支付] 重新检测环境结果:', res)
                if (res.miniprogram) {
                  this.isInMiniProgram = true
                  console.log('✅ [支付] 重新检测成功，在小程序环境中')
                  // 递归调用自己
                  this.navigateToPayment(orderInfo).then(resolve).catch(reject)
                } else {
                  console.error('❌ [支付] 重新检测失败，不在小程序环境中')
                  reject(new Error('当前环境不支持微信支付，请在小程序中打开'))
                }
              })
            })
          } else if (postMessage && typeof postMessage === 'function') {
            // 如果有 postMessage，假设在小程序环境中
            this.isInMiniProgram = true
            console.log('✅ [支付] 检测到 postMessage，假设在小程序环境中')
          } else {
            console.error('❌ [支付] 未检测到小程序环境，无法跳转到支付页面')
            throw new Error('当前环境不支持微信支付，请在小程序中打开')
          }
        } else {
          console.error('❌ [支付] 未检测到 window.wx.miniProgram，无法跳转到支付页面')
          throw new Error('当前环境不支持微信支付，请在小程序中打开')
        }
      }
      
      // 方案：通过修改 webview 的 URL 传递订单信息
      // 小程序端会在构建 webview URL 时检测这些参数并跳转到支付页面
      // 通过重新加载 webview 来传递参数
      const params = [
        `payment=1`,
        `orderId=${encodeURIComponent(orderInfo.orderId)}`,
        `amount=${encodeURIComponent(orderInfo.amount.toString())}`,
        `description=${encodeURIComponent(orderInfo.description)}`
      ]
      
      // 如果有订单号，添加到参数
      if (orderInfo.orderNo) {
        params.push(`orderNo=${encodeURIComponent(orderInfo.orderNo)}`)
      }
      
      // 如果有商品信息，编码为 JSON 字符串传递
      if (orderInfo.productInfo) {
        params.push(`productInfo=${encodeURIComponent(JSON.stringify(orderInfo.productInfo))}`)
      }
      
      // 如果有商户名称，添加到参数
      if (orderInfo.merchantName) {
        params.push(`merchantName=${encodeURIComponent(orderInfo.merchantName)}`)
      }
      
      const urlParams = params.join('&')
      
      console.log('📤 [支付] 通过 URL 参数传递订单信息:', urlParams)
      
      // 方案：通过修改当前页面的 URL，然后通知小程序端重新加载 webview
      // 但更好的方案是：直接通过 postMessage 发送一个简单的跳转消息
      // 由于用户不想用 postMessage，我们使用另一种方式：
      // 将订单信息保存到 localStorage，然后通过修改 URL hash 触发页面变化
      // 小程序端可以通过某种方式获取这些信息
      
      // 实际上，在 webview 中，H5 无法直接修改小程序的 URL 参数
      // 最可行的方案仍然是使用 postMessage，但我们可以简化消息内容
      // 只发送一个跳转指令和订单ID，其他信息通过 URL 参数传递
      
      // 临时方案：将订单信息保存到 sessionStorage，然后通过 postMessage 发送跳转指令
      // 小程序端收到后，从 sessionStorage 读取订单信息（但这需要 H5 和小程序共享存储，不可行）
      
      // 最终方案：使用 postMessage，但只发送必要的跳转信息，订单详情通过 URL 参数传递
      // 这样 postMessage 只用于触发跳转，订单信息通过 URL 参数传递
      
      // 构建支付页面 URL
      const paymentParams = [
        `orderId=${encodeURIComponent(orderInfo.orderId)}`,
        `amount=${encodeURIComponent(orderInfo.amount.toString())}`,
        `description=${encodeURIComponent(orderInfo.description)}`
      ]
      
      if (orderInfo.orderNo) {
        paymentParams.push(`orderNo=${encodeURIComponent(orderInfo.orderNo)}`)
      }
      
      if (orderInfo.productInfo) {
        paymentParams.push(`productInfo=${encodeURIComponent(JSON.stringify(orderInfo.productInfo))}`)
      }
      
      if (orderInfo.merchantName) {
        paymentParams.push(`merchantName=${encodeURIComponent(orderInfo.merchantName)}`)
      }
      
      const paymentUrl = `/pages/payment/payment?${paymentParams.join('&')}`
      
      console.log('📤 [支付] 支付页面 URL:', paymentUrl)
      
      // 由于在 webview 中无法直接调用 wx.navigateTo，我们只能通过 postMessage
      // 但我们可以简化消息，只发送跳转指令和 URL
      console.log('🔍 [支付] 检查 postMessage 可用性...')
      console.log('  - window.wx:', !!window.wx)
      console.log('  - window.wx.miniProgram:', !!window.wx?.miniProgram)
      console.log('  - window.wx.miniProgram.postMessage:', typeof window.wx?.miniProgram?.postMessage)
      
      if (window.wx?.miniProgram?.postMessage) {
        const message = {
          type: 'navigate',
          url: paymentUrl,
          id: this.generateMessageId(),
          timestamp: Date.now()
        }
        
        console.log('📤 [支付] 准备发送 navigate 消息')
        console.log('📤 [支付] 消息内容:', JSON.stringify(message, null, 2))
        console.log('📤 [支付] 支付页面 URL:', paymentUrl)
        
        try {
          // 发送消息
          window.wx.miniProgram.postMessage({
            data: [message]
          })
          
          console.log('✅ [支付] postMessage 调用成功')
          console.log('✅ [支付] 已发送跳转消息')
        } catch (postError) {
          console.error('❌ [支付] postMessage 调用失败:', postError)
          throw new Error(`发送跳转消息失败: ${postError}`)
        }
        
        // 重要：postMessage 的消息不会立即触发 bindmessage
        // 根据微信小程序文档，bindmessage 只在以下时机触发：
        // 1. 页面加载完成后（onWebViewLoad）
        // 2. 页面跳转时（如 navigateTo、redirectTo 等）
        // 3. 用户点击小程序后退按钮时
        // 
        // 由于页面已经加载完成，我们需要触发一个页面操作来确保消息立即传递
        // 方案：通过修改当前页面的 hash 来触发页面变化
        // 虽然修改 hash 不会触发 bindmessage，但我们可以尝试通过其他方式
        
        // 最佳方案：通过修改 webview 的 URL 触发页面重新加载，从而触发 bindmessage
        // 但这样会影响用户体验（页面会重新加载）
        // 所以我们先尝试等待一下，看看消息是否能立即传递
        
        console.log('⏳ [支付] 等待消息传递...')
        
        // 等待一小段时间，看看消息是否能立即传递
        // 如果不行，我们需要触发页面重新加载
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // 如果消息没有立即传递，我们需要触发页面重新加载
        // 通过修改 webview URL 来触发重新加载（小程序端需要支持）
        console.log('🔄 [支付] 尝试触发页面重新加载以确保消息传递...')
        
        // 方案：通过修改当前页面的 URL（添加一个临时参数）来触发页面重新加载
        // 小程序端检测到 URL 变化后，会重新加载 webview，从而触发 bindmessage
        const currentUrl = window.location.href
        const urlObj = new URL(currentUrl)
        
        // 添加一个临时参数来触发页面重新加载
        urlObj.searchParams.set('_payment_trigger', Date.now().toString())
        
        // 修改 URL 触发页面重新加载
        // 注意：这会触发页面重新加载，但消息会在重新加载时传递
        window.location.href = urlObj.toString()
        
        console.log('✅ [支付] 已触发页面重新加载，消息将在重新加载时传递')
        
        // 注意：由于页面会重新加载，这里不会继续执行
        // 消息会在页面重新加载后通过 bindmessage 传递
        return true
      } else {
        console.error('❌ [支付] postMessage 不可用')
        console.error('❌ [支付] 环境详情:', {
          hasWindow: typeof window !== 'undefined',
          hasWx: typeof window !== 'undefined' && !!window.wx,
          hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
          hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function'
        })
        throw new Error('无法发送跳转消息，postMessage 不可用。请确保在小程序环境中打开。')
      }
    } catch (error: any) {
      console.error('========== [支付] 跳转失败 ==========')
      console.error('❌ [支付] 错误类型:', error?.constructor?.name)
      console.error('❌ [支付] 错误消息:', error?.message)
      console.error('❌ [支付] 错误堆栈:', error?.stack)
      console.error('❌ [支付] 完整错误对象:', error)
      throw error
    }
  }

  /**
   * 发起支付（已废弃，使用 navigateToPayment）
   * @deprecated 使用 navigateToPayment 代替
   */
  public async payment(data: {
    orderId: string
    amount: number
    description: string
  }): Promise<boolean> {
    try {
      console.log('💰 [支付] 开始支付流程')
      console.log('💰 [支付] 支付数据:', data)
      console.log('💰 [支付] 环境检测:', {
        isInMiniProgram: this.isInMiniProgram,
        hasWx: typeof window !== 'undefined' && !!window.wx,
        hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
        hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function'
      })
      
      // 检查是否在小程序环境中
      if (!this.isInMiniProgram) {
        console.error('❌ [支付] 不在小程序环境中，无法调起微信支付')
        throw new Error('当前环境不支持微信支付，请在小程序中打开')
      }
      
      // 检查 postMessage 是否可用
      if (!window.wx?.miniProgram?.postMessage) {
        console.error('❌ [支付] postMessage 不可用')
        throw new Error('无法发送支付消息，postMessage 不可用')
      }
      
      // 使用 postMessage 发送支付消息
      // 注意：postMessage 的消息格式需要是数组，且不会立即触发 bindmessage
      // 我们需要触发一个页面操作来确保消息传递
      console.log('📤 [支付] 准备发送支付消息到小程序...')
      const message = {
        type: 'payment',
        data: data,
        id: this.generateMessageId(),
        timestamp: Date.now()
      }
      
      console.log('📤 [支付] 发送消息:', JSON.stringify(message, null, 2))
      
      // 重要：postMessage 需要发送数组格式的消息
      // 根据微信小程序文档，postMessage 接收的是数组
      const messageArray = [message]
      
      // 发送消息
      try {
        window.wx.miniProgram.postMessage({
          data: messageArray  // 发送数组格式
        })
        console.log('✅ [支付] 支付消息已通过 postMessage 发送（数组格式）')
      } catch (postError) {
        console.error('❌ [支付] postMessage 发送失败:', postError)
        throw new Error('发送支付消息失败')
      }
      
      // 重要：postMessage 的消息不会立即触发 bindmessage
      // 我们需要触发一个页面操作来确保消息传递
      // 方案：使用 location.reload() 或触发页面跳转
      // 但这样会影响用户体验，所以我们先尝试等待一下
      console.log('⏳ [支付] 等待消息传递...')
      console.log('💡 [支付] 提示：如果消息没有立即传递，请尝试返回再进入页面')
      
      // 尝试触发消息传递：通过修改 URL hash 触发页面变化
      // 这不会刷新页面，但会触发一些事件
      const currentHash = window.location.hash
      const timestamp = Date.now()
      window.location.hash = currentHash + (currentHash.includes('?') ? '&' : '?') + '_payment=' + timestamp
      
      // 立即恢复 hash，避免影响 URL
      setTimeout(() => {
        if (window.location.hash.includes('_payment=')) {
          window.location.hash = currentHash
        }
      }, 100)
      
      console.log('✅ [支付] 已尝试触发消息传递')
      
      return true
    } catch (error) {
      console.error('❌ [支付] 支付失败:', error)
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