/**
 * 微信小程序 WebView Bridge
 * 用于 H5 页面与微信小程序之间的双向通信
 */

export interface MiniProgramMessage {
  type: string
  data: any
  msgId?: string
  timestamp?: number
}

export interface MessageResult<T = any> {
  success: boolean
  data?: T
  errMsg?: string
}

class MiniProgramBridge {
  private static instance: MiniProgramBridge | null = null
  private pendingMessages = new Map<string, {
    resolve: (value: MessageResult) => void
    reject: (reason: any) => void
    timeout: number
  }>()

  static getInstance(): MiniProgramBridge {
    if (!MiniProgramBridge.instance) {
      MiniProgramBridge.instance = new MiniProgramBridge()
    }
    return MiniProgramBridge.instance
  }

  /**
   * 检查是否在微信小程序环境中
   */
  isMiniProgram(): boolean {
    try {
      return typeof window !== 'undefined' &&
             !!window.wx?.miniProgram &&
             typeof window.wx.miniProgram.postMessage === 'function'
    } catch (error) {
      return false
    }
  }

  /**
   * 发送消息到小程序并等待确认
   * @param type 消息类型
   * @param data 消息数据
   * @param timeout 超时时间（毫秒），默认5秒
   * @returns Promise<MessageResult> 消息处理结果
   */
  async sendMessage(
    type: string,
    data: any,
    timeout = 5000
  ): Promise<MessageResult> {
    if (!this.isMiniProgram()) {
      console.warn('⚠️ Not in WeChat mini-program environment')
      return {
        success: false,
        errMsg: 'Not in mini-program environment'
      }
    }

    const msgId = this.generateMessageId()
    
    try {
      // 发送消息到小程序
      if (window.wx?.miniProgram?.postMessage) {
        window.wx.miniProgram.postMessage({
          type,
          data,
          msgId,
          timestamp: Date.now()
        })
      } else {
        throw new Error('miniProgram.postMessage is not available')
      }

      console.log(`📤 Sent message to mini-program: ${type}`, { msgId, data })

      // 等待确认
      return await new Promise<MessageResult>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          this.pendingMessages.delete(msgId)
          resolve({
            success: false,
            errMsg: 'Message timeout'
          })
        }, timeout)

        this.pendingMessages.set(msgId, {
          resolve: (result) => {
            window.clearTimeout(timer)
            resolve(result)
          },
          reject: (error) => {
            window.clearTimeout(timer)
            reject(error)
          },
          timeout: timer
        })
      })
    } catch (error) {
      console.error('❌ Failed to send message to mini-program:', error)
      return {
        success: false,
        errMsg: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 处理来自小程序的消息确认
   * 这个方法由 App.vue 中的 window.addEventListener('message') 调用
   */
  handleIncomingMessage(message: MiniProgramMessage & { data: any }) {
    const { type, data } = message

    // 处理消息确认 - 从 data 中获取 msgId
    if (type.endsWith('Result') && data?.msgId) {
      const originalMsgId = data.msgId
      
      if (this.pendingMessages.has(originalMsgId)) {
        const handler = this.pendingMessages.get(originalMsgId)
        this.pendingMessages.delete(originalMsgId)

        if (handler) {
          handler.resolve({
            success: data.success !== false, // 默认成功
            data: data.data,
            errMsg: data.errMsg
          })
        }

        console.log(`✅ Message confirmed: ${originalMsgId}`, data)
      } else {
        console.warn(`⚠️ No pending message found for: ${originalMsgId}`)
      }
    }
  }

  /**
   * 生成唯一消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理所有待处理的消息
   */
  clearPendingMessages() {
    this.pendingMessages.forEach(({ timeout }) => {
      clearTimeout(timeout as any)
    })
    this.pendingMessages.clear()
  }
}

/**
 * 便捷方法 - 发送支付请求
 */
export async function sendPaymentRequest(data: {
  orderId: string
  amount: number
  description: string
}): Promise<MessageResult> {
  const bridge = MiniProgramBridge.getInstance()
  return bridge.sendMessage('payment', data)
}

/**
 * 便捷方法 - 发送分享请求
 */
export async function sendShareRequest(data: {
  title: string
  desc: string
  path: string
  imageUrl?: string
}): Promise<MessageResult> {
  const bridge = MiniProgramBridge.getInstance()
  return bridge.sendMessage('share', data)
}

/**
 * 便捷方法 - 请求登录
 */
export async function sendLoginRequest(): Promise<MessageResult> {
  const bridge = MiniProgramBridge.getInstance()
  return bridge.sendMessage('login', {})
}

/**
 * 便捷方法 - 获取用户信息
 */
export async function sendGetUserInfoRequest(): Promise<MessageResult> {
  const bridge = MiniProgramBridge.getInstance()
  return bridge.sendMessage('getUserInfo', {})
}

/**
 * 便捷方法 - 获取位置信息
 */
export async function sendGetLocationRequest(): Promise<MessageResult> {
  const bridge = MiniProgramBridge.getInstance()
  return bridge.sendMessage('getLocation', {})
}

/**
 * 导出单例实例
 */
export const miniprogramBridge = MiniProgramBridge.getInstance()

