/**
 * Vue WebView Bridge 插件
 * 提供全局访问 WebView Bridge 的能力
 */

import type { App } from 'vue'
import webViewBridge from '@/utils/webview-bridge'

export interface WebViewBridgePluginOptions {
  // 插件配置选项
  debug?: boolean
}

const WebViewBridgePlugin = {
  install(app: App, options: WebViewBridgePluginOptions = {}) {
    // 全局属性
    app.config.globalProperties.$webViewBridge = webViewBridge

    // 全局提供者
    app.provide('webViewBridge', webViewBridge)

    // 调试模式
    if (options.debug) {
      console.log('🔧 WebView Bridge Plugin 已安装 (调试模式)')
    }

    // 初始化时检查是否在小程序环境
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        console.log('🚀 WebView Bridge Plugin 已准备就绪')
      })
    }
  }
}

export default WebViewBridgePlugin

// 类型声明
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $webViewBridge: typeof webViewBridge
  }
}