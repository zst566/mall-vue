import { useAuthStore } from '@/stores/auth'
import type { Permission } from '@/router/guards'

// 权限检查器
export class PermissionChecker {
  // 检查是否有指定权限
  static hasPermission(permission: Permission): boolean {
    const authStore = useAuthStore()
    switch (permission) {
      case 'public':
        return true
      case 'customer':
        return authStore.isAuthenticated
      case 'merchant':
        return authStore.isAuthenticated &&
               (authStore.user?.role === 'merchant' || authStore.user?.role === 'admin')
      case 'admin':
        return authStore.isAuthenticated && authStore.user?.role === 'admin'
      default:
        return false
    }
  }

  // 检查是否有所有指定权限
  static hasPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }

  // 检查是否有任意指定权限
  static hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  // 检查用户角色
  static hasRole(role: string): boolean {
    const authStore = useAuthStore()
    return authStore.user?.role === role
  }

  // 检查是否为管理员
  static isAdmin(): boolean {
    return this.hasRole('admin')
  }

  // 检查是否为商户
  static isMerchant(): boolean {
    return this.hasRole('merchant')
  }

  // 检查是否为普通用户
  static isCustomer(): boolean {
    return this.hasRole('customer') || !this.hasRole('merchant') && !this.hasRole('admin')
  }
}

// 路由权限工具
export class RoutePermission {
  // 检查路由访问权限
  static canAccessRoute(path: string): boolean {
    const routePermissions: Record<string, Permission[]> = {
      // 公开路由
      '/': ['public'],
      '/login': ['public'],
      '/register': ['public'],
      '/404': ['public'],
      '/500': ['public'],

      // 客户端路由
      '/home': ['customer'],
      '/products': ['customer'],
      '/products/*': ['customer'],
      '/product-detail/*': ['customer'],
      '/orders': ['customer'],
      '/orders/*': ['customer'],
      '/profile': ['customer'],
      '/address': ['customer'],
      '/address/*': ['customer'],
      '/settings': ['customer'],

      // 商户端路由
      '/merchant': ['merchant'],
      '/merchant/*': ['merchant'],
      '/merchant/scan': ['merchant'],
      '/merchant/orders': ['merchant'],
      '/merchant/statistics': ['merchant'],
      '/merchant/settings': ['merchant'],
    }

    // 查找匹配的路由权限
    for (const [routePattern, permissions] of Object.entries(routePermissions)) {
      if (this.routeMatches(path, routePattern)) {
        return PermissionChecker.hasAnyPermission(permissions)
      }
    }

    return false
  }

  // 路由匹配
  private static routeMatches(path: string, pattern: string): boolean {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return path.startsWith(prefix)
    }
    return path === pattern
  }

  // 获取用户可访问的路由
  static getAccessibleRoutes(): string[] {
    const accessibleRoutes: string[] = []

    // 公开路由
    accessibleRoutes.push('/')

    // 认证用户的路由
    if (PermissionChecker.hasPermission('customer')) {
      accessibleRoutes.push(
        '/home',
        '/products',
        '/orders',
        '/profile',
        '/settings'
      )
    }

    // 商户路由
    if (PermissionChecker.hasPermission('merchant')) {
      accessibleRoutes.push(
        '/merchant',
        '/merchant/scan',
        '/merchant/orders',
        '/merchant/statistics'
      )
    }

    // 管理员路由
    if (PermissionChecker.hasPermission('admin')) {
      accessibleRoutes.push('/admin')
    }

    return accessibleRoutes
  }
}

// 操作权限管理
export class OperationPermission {
  // 订单操作权限
  static canManageOrder(orderStatus: string, userRole?: string): boolean {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) return false

    // 根据订单状态和用户角色判断操作权限
    switch (orderStatus) {
      case 'pending':
      case 'pending_payment':
        return authStore.isAuthenticated

      case 'pending_verification':
        return authStore.user?.role === 'merchant'

      case 'verified':
      case 'completed':
        return authStore.user?.role === 'merchant' || authStore.user?.id === this.getOrderOwner(orderStatus)

      case 'cancelled':
      case 'refunded':
        return true

      default:
        return false
    }
  }

  // 支付操作权限
  static canPerformPayment(orderId: string): boolean {
    const authStore = useAuthStore()

    // 未登录用户不能支付
    if (!authStore.isAuthenticated) return false

    // 商户不能为自己商户的订单支付（避免重复支付）
    if (authStore.user?.role === 'merchant') {
      const orderOwner = this.getOrderOwner(orderId)
      return authStore.user.id !== orderOwner
    }

    return true
  }

  // 退款操作权限
  static canRefund(orderId: string): boolean {
    const authStore = useAuthStore()

    // 只有商户可以处理退款
    if (authStore.user?.role !== 'merchant') return false

    // 检查订单状态是否允许退款
    const orderStatus = this.getOrderStatus(orderId)
    return ['verified', 'completed'].includes(orderStatus)
  }

  // 用户资料操作权限
  static canManageProfile(userId?: string): boolean {
    const authStore = useAuthStore()

    // 用户只能管理自己的资料，商户可以管理自己的商户资料
    if (!userId) return authStore.isAuthenticated

    return authStore.user?.id === userId || authStore.user?.role === 'merchant'
  }

  // 商品操作权限
  static canManageProduct(productId?: string): boolean {
    const authStore = useAuthStore()

    // 只有商户可以管理商品
    if (authStore.user?.role !== 'merchant') return false

    return true
  }

  // 辅助方法：获取订单所有者（简化版）
  private static getOrderOwner(orderId: string): string {
    // 实际项目中应该调用API获取订单信息
    return 'user_123'
  }

  // 辅助方法：获取订单状态（简化版）
  private static getOrderStatus(orderId: string): string {
    // 实际项目中应该调用API获取订单信息
    return 'verified'
  }
}

// 权限指令
export const permissionDirectives = {
  // v-permission 指令
  permission: {
    mounted(el: HTMLElement, binding: { value: Permission | Permission[] }) {
      const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]

      if (!PermissionChecker.hasAnyPermission(permissions)) {
        el.style.display = 'none'
      }
    },

    updated(el: HTMLElement, binding: { value: Permission | Permission[] }) {
      const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]

      if (!PermissionChecker.hasAnyPermission(permissions)) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }
  },

  // v-role 指令
  role: {
    mounted(el: HTMLElement, binding: { value: string | string[] }) {
      const roles = Array.isArray(binding.value) ? binding.value : [binding.value]

      if (!roles.includes(PermissionChecker.authStore.user?.role || '')) {
        el.style.display = 'none'
      }
    },

    updated(el: HTMLElement, binding: { value: string | string[] }) {
      const roles = Array.isArray(binding.value) ? binding.value : [binding.value]

      if (!roles.includes(PermissionChecker.authStore.user?.role || '')) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }
  },

  // v-if-permission 指令
  ifPermission: {
    mounted(el: HTMLElement, binding: { value: Permission | Permission[] }) {
      const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]

      if (!PermissionChecker.hasAnyPermission(permissions)) {
        el.remove()
      }
    },

    updated(el: HTMLElement, binding: { value: Permission | Permission[] }) {
      const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]

      if (!PermissionChecker.hasAnyPermission(permissions)) {
        el.remove()
      }
    }
  }
}

// 权限守卫组合式函数
export function usePermission() {
  const authStore = useAuthStore()

  // 检查权限
  const hasPermission = (permission: Permission): boolean => {
    return PermissionChecker.hasPermission(permission)
  }

  // 检查多个权限
  const hasPermissions = (permissions: Permission[]): boolean => {
    return PermissionChecker.hasPermissions(permissions)
  }

  // 检查任意权限
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return PermissionChecker.hasAnyPermission(permissions)
  }

  // 检查角色
  const hasRole = (role: string): boolean => {
    return PermissionChecker.hasRole(role)
  }

  // 获取用户权限列表
  const getUserPermissions = (): Permission[] => {
    const permissions: Permission[] = ['public']

    if (authStore.isAuthenticated) {
      permissions.push('customer')

      if (authStore.user?.role === 'merchant' || authStore.user?.role === 'admin') {
        permissions.push('merchant')
      }

      if (authStore.user?.role === 'admin') {
        permissions.push('admin')
      }
    }

    return permissions
  }

  // 获取用户角色
  const getUserRole = (): string => {
    return authStore.user?.role || 'guest'
  }

  // 获取用户等级
  const getUserLevel = (): 'guest' | 'customer' | 'merchant' | 'admin' => {
    const role = authStore.user?.role || 'guest'
    return role
  }

  // 监听权限变化
  const onPermissionChange = (callback: (permissions: Permission[]) => void) => {
    authStore.$subscribe((mutation, state) => {
      if (mutation.type.includes('setAuth') || mutation.type.includes('updateUser')) {
        const permissions = getUserPermissions()
        callback(permissions)
      }
    })
  }

  return {
    hasPermission,
    hasPermissions,
    hasAnyPermission,
    hasRole,
    getUserPermissions,
    getUserRole,
    getUserLevel,
    onPermissionChange,
    authStore
  }
}

// 高级权限管理
export class AdvancedPermission {
  // 检查权限并执行回调
  static checkAndExecute(
    permission: Permission,
    onSuccess: () => void,
    onFailure?: () => void
  ): boolean {
    if (PermissionChecker.hasPermission(permission)) {
      onSuccess()
      return true
    } else {
      onFailure?.()
      return false
    }
  }

  // 条件权限检查
  static checkConditionalPermission(
    condition: () => boolean,
    permission: Permission
  ): boolean {
    return condition() && PermissionChecker.hasPermission(permission)
  }

  // 权限链检查
  static checkPermissionChain(permissions: Permission[]): boolean {
    return permissions.every(permission => PermissionChecker.hasPermission(permission))
  }

  // 动态权限计算
  static calculateDynamicPermissions(
    basePermissions: Permission[],
    additionalConditions: { condition: () => boolean; permissions: Permission[] }[]
  ): Permission[] {
    let permissions = [...basePermissions]

    additionalConditions.forEach(({ condition, permissions: additional }) => {
      if (condition()) {
        permissions = [...new Set([...permissions, ...additional])]
      }
    })

    return permissions
  }
}