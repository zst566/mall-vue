/**
 * WebView Bridge Composable
 * 提供在组件中使用 WebView Bridge 的便捷方法
 */

import { inject, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'
import webViewBridge from '@/utils/webview-bridge'

export interface UseWebViewBridgeOptions {
  autoInit?: boolean
  debug?: boolean
}

export function useWebViewBridge(options: UseWebViewBridgeOptions = {}) {
  const { autoInit = true, debug = process.env.NODE_ENV === 'development' } = options

  // 响应式状态
  const isReady = ref(false)
  const isInMiniProgram = ref(false)
  const error = ref<string | null>(null)

  // 注入 WebView Bridge 实例
  const bridge = inject('webViewBridge', webViewBridge)

  /**
   * 初始化 WebView Bridge
   */
  const init = async () => {
    try {
      if (debug) {
        console.log('🔧 初始化 WebView Bridge...')
      }

      // 检查是否在小程序环境
      if (typeof window !== 'undefined' && window.wx?.miniProgram) {
        window.wx.miniProgram.getEnv?.((res: { miniprogram: boolean }) => {
          isInMiniProgram.value = res.miniprogram
          isReady.value = true

          if (debug) {
            console.log(`✅ WebView Bridge 初始化完成，环境: ${res.miniprogram ? '小程序' : 'H5'}`)
          }
        })
      } else {
        isReady.value = true
        if (debug) {
          console.log('⚠️ WebView Bridge 初始化完成，环境: 普通浏览器')
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
      console.error('❌ WebView Bridge 初始化失败:', err)
    }
  }

  /**
   * 获取 mall_token
   */
  const getMallToken = async () => {
    if (!isReady.value) {
      throw new Error('WebView Bridge 未就绪')
    }

    try {
      const result = await bridge.getMallToken()

      if (debug) {
        console.log('✅ 获取 mall_token 成功:', result)
      }

      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取 mall_token 失败'
      error.value = errorMsg

      if (debug) {
        console.error('❌ 获取 mall_token 失败:', err)
      }

      throw err
    }
  }

  /**
   * 登录
   */
  const login = async () => {
    if (!isReady.value) {
      throw new Error('WebView Bridge 未就绪')
    }

    try {
      const result = await bridge.login()

      if (debug) {
        console.log('✅ 登录成功:', result)
      }

      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '登录失败'
      error.value = errorMsg

      if (debug) {
        console.error('❌ 登录失败:', err)
      }

      throw err
    }
  }

  /**
   * 获取用户信息
   */
  const getUserInfo = async () => {
    if (!isReady.value) {
      throw new Error('WebView Bridge 未就绪')
    }

    try {
      const result = await bridge.getUserInfo()

      if (debug) {
        console.log('✅ 获取用户信息成功:', result)
      }

      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取用户信息失败'
      error.value = errorMsg

      if (debug) {
        console.error('❌ 获取用户信息失败:', err)
      }

      throw err
    }
  }

  /**
   * 显示 Toast
   */
  const showToast = (title: string, icon: 'success' | 'error' | 'loading' | 'none' = 'none', duration = 2000) => {
    if (!isReady.value) {
      console.warn('WebView Bridge 未就绪，无法显示 Toast')
      return
    }

    bridge.showToast({ title, icon, duration }).catch(err => {
      console.error('显示 Toast 失败:', err)
    })
  }

  /**
   * 显示 Modal
   */
  const showModal = async (options: {
    title: string
    content: string
    showCancel?: boolean
    cancelText?: string
    confirmText?: string
  }) => {
    if (!isReady.value) {
      console.warn('WebView Bridge 未就绪，无法显示 Modal')
      return { confirm: false }
    }

    try {
      return await bridge.showModal(options)
    } catch (err) {
      console.error('显示 Modal 失败:', err)
      return { confirm: false }
    }
  }

  /**
   * 监听小程序消息
   */
  const on = (type: string, handler: (data: any) => void) => {
    if (!isReady.value) {
      console.warn('WebView Bridge 未就绪，无法监听消息')
      return
    }

    bridge.on(type, handler)
  }

  /**
   * 移除消息监听
   */
  const off = (type: string, handler?: (data: any) => void) => {
    bridge.off(type, handler)
  }

  // 自动初始化
  if (autoInit) {
    init()
  }

  // 组件卸载时清理
  onUnmounted(() => {
    // 注意：不要在组件卸载时销毁全局 bridge，只清理组件相关的监听器
    if (debug) {
      console.log('🧹 WebView Bridge 组件已清理')
    }
  })

  return {
    // 状态
    isReady: readonly(isReady) as Ref<boolean>,
    isInMiniProgram: readonly(isInMiniProgram) as Ref<boolean>,
    error: readonly(error) as Ref<string | null>,

    // 方法
    init,
    getMallToken,
    login,
    getUserInfo,
    showToast,
    showModal,
    on,
    off,

    // 原始 bridge 实例
    bridge
  }
}

// 为了保持响应式，使用 readonly
function readonly<T>(ref: T): T {
  return ref
}