import { useAuthStore } from '@/stores/auth'
import { useWechatParams } from '@/composables/useWechatParams'
import { showToast, showLoadingToast } from 'vant'
import router from '@/router'

// 权限类型
export type Permission = 'customer' | 'merchant' | 'admin' | 'public'

// 路由守卫配置
export const guardConfig = {
  // 公开路由，无需权限验证
  public: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/404',
    '/500'
  ],

  // 客户端路由，需要登录
  customer: [
    '/home',
    '/orders',
    '/orders/*',
    '/profile',
    '/address',
    '/address/*',
    '/settings',
    '/payment',
    '/payment/*',
    '/success',
    '/failed'
  ],

  // 商户端路由，需要商户权限
  merchant: [
    '/merchant',
    '/merchant/*',
    '/merchant/scan',
    '/merchant/orders',
    '/merchant/orders/*',
    '/merchant/qr-management',
    '/merchant/statistics',
    '/merchant/settings',
    '/merchant/service',
    '/merchant/settlement',
    '/merchant/refunds',
    '/merchant/invoices'
  ],

  // 管理员路由，需要管理员权限
  admin: [
    '/admin',
    '/admin/*'
  ]
}

// 检查路由是否需要权限验证
export function checkRoutePermission(path: string, requiredPermission: Permission): boolean {
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path

  // 公开路由可以直接访问
  if (requiredPermission === 'public') {
    return true
  }

  // 检查客户路由权限
  if (requiredPermission === 'customer' && guardConfig.customer.some(route => {
    const prefix = route.endsWith('*') ? route.slice(0, -1) : route
    return normalizedPath === prefix || normalizedPath.startsWith(prefix)
  })) {
    return true
  }

  // 检查商户路由权限
  if (requiredPermission === 'merchant' && guardConfig.merchant.some(route => {
    const prefix = route.endsWith('*') ? route.slice(0, -1) : route
    return normalizedPath === prefix || normalizedPath.startsWith(prefix)
  })) {
    return true
  }

  // 检查管理员路由权限
  if (requiredPermission === 'admin' && guardConfig.admin.some(route => {
    const prefix = route.endsWith('*') ? route.slice(0, -1) : route
    return normalizedPath === prefix || normalizedPath.startsWith(prefix)
  })) {
    return true
  }

  return false
}

// 权限检查器
export class PermissionChecker {
  // 检查是否已登录
  static isUserAuthenticated(): boolean {
    const authStore = useAuthStore()
    return authStore.isAuthenticated
  }

  // 检查用户权限
  static hasUserPermission(requiredPermission: Permission): boolean {
    const authStore = useAuthStore()

    // 公开权限无需验证
    if (requiredPermission === 'public') {
      return true
    }

    // 用户未登录
    if (!this.isUserAuthenticated()) {
      return false
    }

    // 客户权限
    if (requiredPermission === 'customer') {
      return true // 所有登录用户都有客户权限
    }

    // 商户权限
    if (requiredPermission === 'merchant') {
      return authStore.user?.role === 'merchant' || authStore.user?.role === 'admin'
    }

    // 管理员权限
    if (requiredPermission === 'admin') {
      return authStore.user?.role === 'admin'
    }

    return false
  }

  // 检查微信环境适配
  static checkWechatEnvironment(path: string): boolean {
    const { isWeChatMiniProgram, isWeChatBrowser } = useWechatParams()

    // 某些页面需要微信环境适配
    const wechatRequiredPaths = [
      '/payment/wechat-pay',
      '/wechat-binding',
      '/wechat-share'
    ]

    if (wechatRequiredPaths.some(route => path.startsWith(route))) {
      if (!isWeChatMiniProgram && !isWeChatBrowser) {
        showToast('请在微信环境中访问')
        return false
      }
    }

    return true
  }
}

// 导航守卫
export function setupRouteGuards(routerInstance: any) {
  routerInstance.beforeEach(async (to, from, next) => {
    const path = to.path
    const { loadWechatParams } = useWechatParams()

    // 加载微信参数
    if (!from.path) {
      await loadWechatParams()
    }

    // 确定需要的权限
    let requiredPermission: Permission = 'public'

    if (checkRoutePermission(path, 'merchant')) {
      requiredPermission = 'merchant'
    } else if (checkRoutePermission(path, 'customer')) {
      requiredPermission = 'customer'
    } else if (checkRoutePermission(path, 'admin')) {
      requiredPermission = 'admin'
    }

    // 检查微信环境
    if (!PermissionChecker.checkWechatEnvironment(path)) {
      next(false)
      return
    }

    // 公开路由直接通过
    if (requiredPermission === 'public') {
      next()
      return
    }

    // 检查权限
    if (!PermissionChecker.hasUserPermission(requiredPermission)) {
      // 用户未登录
      if (!PermissionChecker.isUserAuthenticated()) {
        // 记录要访问的页面，登录后跳转回来
        sessionStorage.setItem('redirectAfterLogin', path)
        showToast('请先登录')
        next('/login')
        return
      }

      // 权限不足
      showToast('权限不足')
      next('/home') // 或返回有权限的页面
      return
    }

    // 检查页面特定权限
    if (!checkPageSpecificAccess(to, requiredPermission)) {
      showToast('无法访问此页面')
      next(false)
      return
    }

    // 检查是否需要加载页面数据
    if (to.meta.requiresDataLoading) {
      await loadPageData(to)
    }

    next()
  })

  routerInstance.afterEach((to) => {
    // 更新页面标题
    document.title = to.meta.title ? `${to.meta.title} - 商场促销平台` : '商场促销平台'

    // 记录页面访问
    trackPageAccess(to)
  })

  // 全局错误处理
  routerInstance.onError((error) => {
    console.error('Router error:', error)
    showToast('页面加载失败')
  })
}

// 检查页面特定访问权限
function checkPageSpecificAccess(to: any, requiredPermission: Permission): boolean {
  // 需要商户特定权限的页面
  if (to.meta.requiresMerchantAccess && requiredPermission !== 'merchant') {
    return false
  }

  // 需要管理员权限的页面
  if (to.meta.requiresAdminAccess && requiredPermission !== 'admin') {
    return false
  }

  // 需要微信环境的页面
  if (to.meta.requiresWeChat && !PermissionChecker.checkWechatEnvironment(to.path)) {
    return false
  }

  return true
}

// 加载页面数据
async function loadPageData(to: any) {
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
    duration: 1000
  })

  try {
    // 根据页面类型加载不同的数据
    const authStore = useAuthStore()

    switch (to.path) {
      case '/home':
        // 加载首页数据
        break

      case '/orders':
      case '/merchant/orders':
        // 加载订单数据
        break

      case '/profile':
        // 加载用户资料
        break

      case '/merchant/statistics':
        // 加载统计数据
        break

      default:
        // 通用数据加载
        break
    }
  } catch (error) {
    console.error('Failed to load page data:', error)
    showToast('数据加载失败')
  }
}

// 记录页面访问
function trackPageAccess(to: any) {
  // 使用 requestIdleCallback 避免阻塞主线程
  const trackAccess = () => {
    try {
      const accessData = {
        path: to.path,
        title: to.meta.title,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }

      // 发送到分析服务（在生产环境中）
      if (window.analytics) {
        window.analytics.track('Page View', accessData)
      }

      // 本地记录（用于调试）
      console.log('Page access:', accessData)
    } catch (error) {
      console.error('Failed to track page access:', error)
    }
  }

  // 如果支持 requestIdleCallback，使用它；否则使用 setTimeout
  if (window.requestIdleCallback) {
    window.requestIdleCallback(trackAccess)
  } else {
    setTimeout(trackAccess, 0)
  }
}

// 导航拦截器
export function setupNavigationInterceptors() {
  // 处理网络错误
  window.addEventListener('offline', () => {
    showToast('网络连接已断开')
  })

  window.addEventListener('online', () => {
    showToast('网络连接已恢复')
  })

  // 处理页面卸载
  window.addEventListener('beforeunload', (e) => {
    const authStore = useAuthStore()

    // 如果有未保存的数据，提示用户
    if (authStore.hasUnsavedData) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
}

// 页面级权限守卫
export function createPageGuard(pageType: string) {
  return async (to: any, from: any, next: any) => {
    const authStore = useAuthStore()

    try {
      // 页面特定的权限检查
      switch (pageType) {
        case 'customer-dashboard':
          if (!authStore.isAuthenticated) {
            next('/login')
            return
          }
          break

        case 'merchant-dashboard':
          if (!authStore.isAuthenticated || authStore.user?.role !== 'merchant') {
            next('/home')
            return
          }
          break

        case 'admin-dashboard':
          if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
            next('/home')
            return
          }
          break

        case 'payment-page':
          if (!authStore.isAuthenticated) {
            next('/login')
            return
          }
          break
      }

      // 加载页面数据
      if (to.meta.requiresData) {
        await loadPageData(to)
      }

      next()
    } catch (error) {
      console.error(`Page guard error for ${pageType}:`, error)
      next('/500')
    }
  }
}

// 导出守卫工具类
export class GuardTools {
  // 获取用户权限列表
  static getUserPermissions(): Permission[] {
    const authStore = useAuthStore()
    const permissions: Permission[] = ['public']

    if (authStore.isAuthenticated) {
      permissions.push('customer')

      if (authStore.user?.role === 'merchant') {
        permissions.push('merchant')
      }

      if (authStore.user?.role === 'admin') {
        permissions.push('merchant', 'admin')
      }
    }

    return permissions
  }

  // 检查是否有特定权限
  static hasPermission(permission: Permission): boolean {
    return this.getUserPermissions().includes(permission)
  }

  // 获取可用路由
  static getAvailableRoutes(): string[] {
    const permissions = this.getUserPermissions()
    const availableRoutes: string[] = []

    permissions.forEach(perm => {
      if (perm === 'public' && guardConfig.public) {
        availableRoutes.push(...guardConfig.public)
      }
      if (perm === 'customer' && guardConfig.customer) {
        availableRoutes.push(...guardConfig.customer)
      }
      if (perm === 'merchant' && guardConfig.merchant) {
        availableRoutes.push(...guardConfig.merchant)
      }
      if (perm === 'admin' && guardConfig.admin) {
        availableRoutes.push(...guardConfig.admin)
      }
    })

    return Array.from(new Set(availableRoutes))
  }

  // 清除导航状态
  static clearNavigationState() {
    sessionStorage.removeItem('redirectAfterLogin')
    sessionStorage.removeItem('navigationHistory')
  }

  // 获取重定向路径
  static getRedirectPath(): string {
    return sessionStorage.getItem('redirectAfterLogin') || '/home'
  }
}