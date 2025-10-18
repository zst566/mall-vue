import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/customer/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: false,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/customer/Products.vue'),
    meta: {
      title: '商品列表',
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
      requiresAuth: false,
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/customer/Profile.vue'),
    meta: {
      title: '个人中心',
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
      requiresAuth: true,
      role: ['admin', 'operator'],
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/merchant/scan',
    name: 'MerchantScan',
    component: () => import('@/views/merchant/Scan.vue'),
    meta: {
      title: '扫码核销',
      requiresAuth: true,
      role: ['admin', 'operator'],
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/merchant/orders',
    name: 'MerchantOrders',
    component: () => import('@/views/merchant/Orders.vue'),
    meta: {
      title: '商户订单',
      requiresAuth: true,
      role: ['admin', 'operator'],
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/merchant/orders/:id',
    name: 'MerchantOrderDetail',
    component: () => import('@/views/merchant/OrderDetail.vue'),
    meta: {
      title: '订单详情',
      requiresAuth: true,
      role: ['admin', 'operator'],
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/merchant/settings',
    name: 'MerchantSettings',
    component: () => import('@/views/merchant/Settings.vue'),
    meta: {
      title: '商户设置',
      requiresAuth: true,
      role: ['admin'],
      hideHeader: false,
      hideFooter: false,
      hideVersionSwitcher: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/common/NotFound.vue'),
    meta: {
      title: '页面不存在',
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

export default router