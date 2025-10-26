import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import router from '@/router'
import './styles/index.scss'
import { createPersistencePlugin, appPersistence } from './utils/persistence'
import WebViewBridgePlugin from '@/plugins/webview-bridge'
import { useWechatParams } from '@/composables/useWechatParams'
import { useAuthStore } from '@/stores/auth'

// 🔥 修复：在创建应用之前就同步提取和保存 URL 中的 token
// 这样路由守卫执行时就能正确识别已登录状态
const initializeAuthBeforeApp = () => {
  console.log('🚀 在应用初始化之前提取 URL 中的认证信息...')
  
  try {
    // 解析 URL 参数
    const urlParams = new URLSearchParams(window.location.search)
    const mallToken = urlParams.get('mall_token')
    const userId = urlParams.get('user_id')
    
    console.log('📋 URL 参数解析（预检查）:')
    console.log('  - mall_token:', mallToken ? '存在' : '不存在')
    console.log('  - user_id:', userId || '不存在')
    
    if (mallToken) {
      console.log('🔐 检测到 mall_token，立即保存到 localStorage')
      console.log('📝 Token 值:', mallToken.substring(0, 20) + '...')
      
      // 直接保存到 localStorage，这样路由守卫就能立即读取
      localStorage.setItem('token', mallToken)
      
      console.log('✅ Token 已同步保存到 localStorage')
    }
  } catch (error) {
    console.error('❌ 预初始化认证状态失败:', error)
  }
}

// 执行预初始化
initializeAuthBeforeApp()

// 创建Vue应用实例
const app = createApp(App)

// 创建Pinia状态管理
const pinia = createPinia()

// 应用持久化插件
pinia.use(createPersistencePlugin())

// 注册路由
app.use(router)
app.use(pinia)

// 注册 WebView Bridge 插件
app.use(WebViewBridgePlugin, {
  debug: process.env.NODE_ENV === 'development'
})

// 初始化应用持久化（必须在pinia注册之后）
appPersistence.initialize()

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// 挂载应用
app.mount('#app')

// 初始化 URL 参数和认证状态（在 Pinia 初始化后更新状态）
const initializeAppAuth = async () => {
  console.log('🚀 开始同步认证状态到 Pinia Store...')
  
  try {
    // 解析 URL 参数
    const urlParams = new URLSearchParams(window.location.search)
    const mallToken = urlParams.get('mall_token')
    const userId = urlParams.get('user_id')
    
    if (mallToken) {
      console.log('🔐 检测到 mall_token，更新 Pinia Store 状态')
      console.log('📝 Token 值:', mallToken.substring(0, 20) + '...')
      
      // 获取 auth store（此时 Pinia 已初始化）
      const authStore = useAuthStore()
      
      // 同步 token 到 store 状态
      authStore.updateTokens({
        token: mallToken,
        refreshToken: '' // 小程序暂时不支持 refresh token
      })
      
      console.log('✅ Token 已同步到 Pinia Store')
      
      // 🔥 修复：不在初始化时自动获取用户信息
      // 用户信息应该在访问需要该信息的页面时才获取
      // 对于从小程序跳转过来的用户，只保存 token，不立即获取用户信息
      console.log('👤 用户信息将在访问需要该信息的页面时获取')
      
      // 清理 URL 中的认证参数，避免泄露
      const url = new URL(window.location.href)
      url.searchParams.delete('mall_token')
      url.searchParams.delete('user_id')
      url.searchParams.delete('timestamp')
      
      // 使用 replaceState 避免产生历史记录
      window.history.replaceState({}, '', url.toString())
      console.log('✅ 已清理 URL 中的认证参数')
    } else {
      console.log('⚠️  未检测到 mall_token，跳过 Pinia Store 更新')
    }
    
    console.log('🚀 认证状态同步完成')
  } catch (error) {
    console.error('❌ 认证状态同步失败:', error)
  }
}

// 延迟执行，确保 Pinia 已初始化
setTimeout(() => {
  initializeAppAuth()
}, 100)

// 隐藏加载动画
setTimeout(() => {
  const loadingElement = document.getElementById('app-loading')
  if (loadingElement) {
    loadingElement.style.display = 'none'
  }
}, 1000)