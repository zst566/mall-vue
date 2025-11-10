import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouteGuards, setupNavigationInterceptors, type Permission } from './guards'

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/customer/Home.vue'),
    meta: {
      title: '首页',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/parking',
    name: 'Parking',
    component: () => import('@/views/customer/Parking.vue'),
    meta: {
      title: '停车服务',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/views/customer/ProductDetail.vue'),
    meta: {
      title: '商品详情',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: false,
      hideFooter: true,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/promotion/:id',
    name: 'PromotionDetail',
    component: () => import('@/views/customer/PromotionDetail.vue'),
    meta: {
      title: '促销活动详情',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: false,
      hideFooter: true,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/customer/Profile.vue'),
    meta: {
      title: '个人中心',
      permission: 'customer' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/customer/Orders.vue'),
    meta: {
      title: '我的订单',
      permission: 'customer' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('@/views/customer/OrderDetail.vue'),
    meta: {
      title: '订单详情',
      permission: 'customer' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/order/:id/refund-request',
    name: 'RefundRequest',
    component: () => import('@/views/customer/RefundRequest.vue'),
    meta: {
      title: '申请退款',
      permission: 'customer' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/address',
    name: 'Address',
    component: () => import('@/views/customer/Address.vue'),
    meta: {
      title: '地址管理',
      permission: 'customer' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/address/add',
    name: 'AddressAdd',
    component: () => import('@/views/customer/AddressAdd.vue'),
    meta: {
      title: '添加地址',
      permission: 'customer' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/address/edit/:id',
    name: 'AddressEdit',
    component: () => import('@/views/customer/AddressEdit.vue'),
    meta: {
      title: '编辑地址',
      permission: 'customer' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/customer/Login.vue'),
    meta: {
      title: '登录',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: true,
      hideFooter: true,
      hideVersionSwitcher: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/customer/Register.vue'),
    meta: {
      title: '注册',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: true,
      hideFooter: true,
      hideVersionSwitcher: true
    }
  },
  {
    path: '/merchant',
    name: 'MerchantHome',
    component: () => import('@/views/merchant/Home.vue'),
    meta: {
      title: '商户中心',
      permission: 'merchant' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false,
      requiresMerchantAccess: true
    }
  },
  {
    path: '/merchant/:id',
    name: 'MerchantById',
    component: () => import('@/views/merchant/Home.vue'),
    meta: {
      title: '商户中心',
      permission: 'merchant' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false,
      requiresMerchantAccess: true
    }
  },
  {
    path: '/merchant/scan',
    name: 'MerchantScan',
    component: () => import('@/views/merchant/Scan.vue'),
    meta: {
      title: '扫码核销',
      permission: 'merchant' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false,
      requiresMerchantAccess: true
    }
  },
  {
    path: '/merchant/orders',
    name: 'MerchantOrders',
    component: () => import('@/views/merchant/Orders.vue'),
    meta: {
      title: '商户订单',
      permission: 'merchant' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false,
      requiresMerchantAccess: true
    }
  },
  {
    path: '/merchant/orders/:id',
    name: 'MerchantOrderDetail',
    component: () => import('@/views/merchant/OrderDetail.vue'),
    meta: {
      title: '订单详情',
      permission: 'merchant' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false,
      requiresMerchantAccess: true
    }
  },
  {
    path: '/merchant/settings',
    name: 'MerchantSettings',
    component: () => import('@/views/merchant/Settings.vue'),
    meta: {
      title: '商户设置',
      permission: 'merchant' as Permission,
      requiresAuth: true,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false,
      requiresMerchantAccess: true
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/common/NotFound.vue'),
    meta: {
      title: '页面不存在',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: true,
      hideFooter: true,
      hideVersionSwitcher: true
    }
  },
  {
    path: '/500',
    name: 'ServerError',
    component: () => import('@/views/common/ServerError.vue'),
    meta: {
      title: '服务器错误',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: true,
      hideFooter: true,
      hideVersionSwitcher: true
    }
  },
  {
    path: '/webview-test',
    name: 'WebViewTest',
    component: () => import('@/views/WebViewTokenExample.vue'),
    meta: {
      title: 'WebView 通讯测试',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/bridge-login-test',
    name: 'BridgeLoginTest',
    component: () => import('@/views/BridgeLoginTest.vue'),
    meta: {
      title: 'Bridge 登录测试',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: true,
      hideFooter: true,
      hideVersionSwitcher: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/common/NotFound.vue'),
    meta: {
      title: '页面不存在',
      permission: 'public' as Permission,
      requiresAuth: false,
      hideHeader: true,
      hideFooter: true,
      hideVersionSwitcher: true
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 设置路由守卫
setupRouteGuards(router)
setupNavigationInterceptors()

export default router