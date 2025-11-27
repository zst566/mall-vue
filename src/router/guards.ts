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
    const wechatParams = useWechatParams()
    const isWeChatMiniProgram = wechatParams.isWechatMiniProgram()
    const isWeChatBrowser = wechatParams.isWechatBrowser()

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
  routerInstance.beforeEach(async (to: any, from: any, next: any) => {
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
    // 对于商户路由，如果用户已登录，允许通过，让后续的商户绑定状态检查来决定是否允许访问
    if (requiredPermission === 'merchant') {
      // 商户路由：如果用户已登录，允许通过，后续会检查商户绑定状态
      if (!PermissionChecker.isUserAuthenticated()) {
        // 用户未登录
        sessionStorage.setItem('redirectAfterLogin', path)
        showToast('请先登录')
        next('/login')
        return
      }
      // 用户已登录，允许通过，后续会检查商户绑定状态
    } else if (!PermissionChecker.hasUserPermission(requiredPermission)) {
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
      next('/') // 重定向到首页
      return
    }

    // 检查页面特定权限
    if (!checkPageSpecificAccess(to, requiredPermission)) {
      showToast('无法访问此页面')
      next(false)
      return
    }

    // 商户路由需要检查绑定状态
    if (requiredPermission === 'merchant' && to.meta.requiresMerchantAccess) {
      try {
        // 检查循环跳转保护
        const redirectKey = 'merchant_redirect_count'
        const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
        if (redirectCount >= 3) {
          console.error('❌ [路由守卫] 检测到循环跳转，中断跳转')
          sessionStorage.removeItem(redirectKey)
          next(false) // 阻止导航
          return
        }
        
        console.log('🔐 [路由守卫] 检查商户路由权限:', to.path)
        
        // 切换到商户模式
        const { useAppStore } = await import('@/stores/app')
        const appStore = useAppStore()
        appStore.switchToMerchant()
        
        const { merchantOperatorService } = await import('@/services/merchantOperator')
        const status = await merchantOperatorService.getMyStatus()
        
        console.log('🔐 [路由守卫] 商户绑定状态:', {
          hasBinding: status.hasBinding,
          hasMerchantUser: !!status.merchantUser,
          approvalStatus: status.merchantUser?.approvalStatus,
          isActive: status.merchantUser?.isActive,
          merchantCode: status.merchantUser?.merchantCode
        })
        
        if (!status.hasBinding || !status.merchantUser) {
          console.warn('⚠️ [路由守卫] 未绑定商户或商户用户信息不存在')
          appStore.switchToCustomer() // 切换回客户模式
          showToast('您尚未绑定商户，请先申请')
          // 清除跳转计数，允许正常跳转到申请页面
          sessionStorage.removeItem(redirectKey)
          next('/customer/merchant-binding')
          return
        }
        
        if (status.merchantUser.approvalStatus !== 'APPROVED' || !status.merchantUser.isActive) {
          console.warn('⚠️ [路由守卫] 商户状态未通过:', {
            approvalStatus: status.merchantUser.approvalStatus,
            isActive: status.merchantUser.isActive
          })
          appStore.switchToCustomer() // 切换回客户模式
          if (status.merchantUser.approvalStatus === 'PENDING') {
            showToast('您的申请正在审核中，请耐心等待')
          } else {
            showToast('您的商户权限已被取消或未审核通过')
          }
          // 清除跳转计数，允许正常跳转到申请页面
          sessionStorage.removeItem(redirectKey)
          next('/customer/merchant-binding')
          return
        }
        
        console.log('✅ [路由守卫] 商户权限检查通过，允许访问')
        // 清除跳转计数，允许正常访问
        sessionStorage.removeItem(redirectKey)
      } catch (error) {
        console.error('❌ [路由守卫] 检查商户绑定状态失败:', error)
        const { useAppStore } = await import('@/stores/app')
        const appStore = useAppStore()
        appStore.switchToCustomer() // 切换回客户模式
        
        // 检查循环跳转保护
        const redirectKey = 'merchant_redirect_count'
        const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
        if (redirectCount >= 3) {
          console.error('❌ [路由守卫] 检测到循环跳转，中断跳转')
          sessionStorage.removeItem(redirectKey)
          next(false) // 阻止导航
          return
        }
        
        showToast('权限验证失败')
        sessionStorage.setItem(redirectKey, String(redirectCount + 1))
        next('/customer/merchant-binding')
        return
      }
    }
    
    // 如果访问申请页面但已审核通过，自动跳转到商户管理页面
    if (to.path === '/customer/merchant-binding' && requiredPermission === 'customer') {
      try {
        // 检查循环跳转保护
        const redirectKey = 'merchant_redirect_count'
        const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
        if (redirectCount >= 3) {
          console.error('❌ [路由守卫] 检测到循环跳转，中断跳转')
          sessionStorage.removeItem(redirectKey)
          next(false) // 阻止导航
          return
        }
        
        const { merchantOperatorService } = await import('@/services/merchantOperator')
        const status = await merchantOperatorService.getMyStatus()
        
        if (status.hasBinding && status.merchantUser?.approvalStatus === 'APPROVED' && status.merchantUser?.isActive) {
          console.log('✅ [路由守卫] 已审核通过，自动跳转到商户管理页面')
          const { useAppStore } = await import('@/stores/app')
          const appStore = useAppStore()
          appStore.switchToMerchant()
          
          // 记录跳转次数
          sessionStorage.setItem(redirectKey, String(redirectCount + 1))
          
          next('/merchant')
          return
        }
      } catch (error) {
        // 如果查询失败，继续正常流程
        console.warn('⚠️ [路由守卫] 检查商户状态失败，继续正常流程:', error)
      }
    } else if (requiredPermission !== 'merchant' && from.path.startsWith('/merchant')) {
      // 离开商户路由时，切换回客户模式
      const { useAppStore } = await import('@/stores/app')
      const appStore = useAppStore()
      appStore.switchToCustomer()
    }

    // 检查是否需要加载页面数据
    if (to.meta.requiresDataLoading) {
      await loadPageData(to)
    }

    next()
  })

  routerInstance.afterEach((to: any) => {
    // 更新页面标题
    document.title = to.meta.title ? `${to.meta.title} - 商场促销平台` : '商场促销平台'

    // 记录页面访问
    trackPageAccess(to)
  })

  // 全局错误处理
  routerInstance.onError((error: any) => {
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
            next('/')
            return
          }
          break

        case 'admin-dashboard':
          if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
            next('/')
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
    return sessionStorage.getItem('redirectAfterLogin') || '/'
  }
}