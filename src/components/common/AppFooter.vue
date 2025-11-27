<template>
  <footer class="app-footer" :class="{ 'merchant-mode': isMerchantMode }">
    <!-- 客户模式导航 -->
    <van-tabbar v-if="!isMerchantMode" v-model="active" route :border="false" class="footer-tabbar">
      <van-tabbar-item replace to="/" icon="home-o" @click="onHomeClick">首页</van-tabbar-item>
      <van-tabbar-item replace to="/parking" icon="location-o">停车</van-tabbar-item>
      <van-tabbar-item replace to="/orders" icon="orders-o">订单</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
    
    <!-- 商户模式导航 -->
    <van-tabbar v-else v-model="merchantActive" route :border="false" class="footer-tabbar merchant-tabbar">
      <van-tabbar-item replace to="/merchant/scan" icon="scan">核销</van-tabbar-item>
      <van-tabbar-item replace to="/merchant/verifications" icon="orders-o">记录</van-tabbar-item>
      <van-tabbar-item replace to="/merchant/statistics" icon="chart-trending-o">统计</van-tabbar-item>
      <van-tabbar-item replace to="/merchant" icon="shop-o">商户</van-tabbar-item>
    </van-tabbar>
  </footer>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAppStore } from '@/stores/app'
  import { useAuthStore } from '@/stores/auth'
  import { showToast } from 'vant'

  const appStore = useAppStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const active = ref(0)
  const merchantActive = ref(0)

  // 计算当前是否为商户模式
  const isMerchantMode = computed(() => appStore.isMerchantMode)

  // 检查用户登录状态的函数
  const checkUserLoginStatus = () => {
    console.log('===== 用户登录状态检查 =====')

    // 检查认证状态 - 输出详细调试信息
    console.log('📱 认证状态检查:')
    console.log('  - isAuthenticated:', authStore.isAuthenticated)
    console.log('  - isLoggedIn:', authStore.isLoggedIn)
    console.log('  - isLoading:', authStore.isLoading)
    console.log('  - hasToken:', !!authStore.token)
    console.log('  - hasUser:', !!authStore.user)
    console.log('  - userRole:', authStore.userRole)

    // 检查localStorage中的token和user
    const storageToken = localStorage.getItem('token')
    const storageUser = localStorage.getItem('user')
    const storageRefreshToken = localStorage.getItem('refreshToken')

    console.log('💾 LocalStorage状态:')
    console.log('  - token存在:', !!storageToken)
    console.log('  - token长度:', storageToken ? storageToken.length : 0)
    console.log('  - user存在:', !!storageUser)
    console.log('  - refreshToken存在:', !!storageRefreshToken)

    // 如果token存在但user不存在，说明可能是首次加载
    if (storageToken && !storageUser) {
      console.warn('⚠️  Token存在但用户信息不存在，可能需要重新获取用户信息')
    }

    // 如果有用户信息，输出用户详情
    if (authStore.user) {
      console.log('👤 用户信息:')
      console.log('  - 用户ID:', authStore.user.id)
      console.log('  - 用户名:', authStore.user.username)
      console.log('  - 手机号:', authStore.user.phone)
      console.log('  - 角色:', authStore.user.role)
      console.log('  - 完整信息:', authStore.user)

      const userName = authStore.user.username || authStore.user.phone || '用户'
      showToast(`登录状态: 已登录，欢迎回来，${userName}！`)
      console.log('✅ 用户已登录，欢迎消息已显示')
    } else {
      console.log('⚠️  用户未登录')
      if (authStore.token) {
        console.warn('⚠️  存在token但用户信息为空，可能需要重新获取')
        showToast('登录状态: Token存在但用户信息为空')
      } else {
        showToast('登录状态: 未登录')
      }
    }

    console.log('===== 用户登录状态检查结束 =====')
  }

  // 首页按钮点击事件
  const onHomeClick = () => {
    console.log('🏠 点击了首页按钮')
    // 触发登录状态检查
    checkUserLoginStatus()
  }

  // 监听路由变化更新底部导航栏状态
  const updateActiveTab = () => {
    const path = route.path

    if (isMerchantMode.value) {
      // 商户模式导航
      if (path.startsWith('/merchant/scan')) {
        merchantActive.value = 0
      } else if (path.startsWith('/merchant/verifications')) {
        merchantActive.value = 1
      } else if (path.startsWith('/merchant/statistics')) {
        merchantActive.value = 2
      } else if (path.startsWith('/merchant')) {
        merchantActive.value = 3
      }
    } else {
      // 客户模式导航
      if (path === '/') {
        active.value = 0
      } else if (path.startsWith('/parking')) {
        active.value = 1
      } else if (path.startsWith('/orders')) {
        active.value = 2
      } else if (path.startsWith('/profile')) {
        active.value = 3
      }
    }
  }

  // 监听路由变化
  watch(
    () => [route.path, isMerchantMode.value],
    () => {
      updateActiveTab()
    },
    { immediate: true }
  )
</script>

<style lang="scss">
  .app-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-index-tabbar);
    width: 100%;
    height: calc(var(--tabbar-height) + var(--safe-area-inset-bottom, 0px));
    background: var(--van-background);
    border-top: 1px solid var(--van-border-color);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    isolation: isolate;
    padding-bottom: var(--safe-area-inset-bottom, 0px);
    box-sizing: border-box;
    transition: background-color 0.2s ease;
    flex-shrink: 0;

    // Vant Tabbar 样式覆盖
    .footer-tabbar {
      position: static !important;
      width: 100% !important;
      height: var(--tabbar-height) !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;

      :deep(.van-tabbar) {
        position: static;
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        box-shadow: none;
        border-radius: 0;
      }

      :deep(.van-tabbar-item) {
        padding: 8px 0;
        height: 100%;
        color: var(--van-text-color-3);
        transition: color 0.2s ease;

        &.van-tabbar-item--active {
          color: var(--van-primary-color);

          .van-tabbar-item__icon {
            color: var(--van-primary-color);
          }

          .van-tabbar-item__text {
            color: var(--van-primary-color);
            font-weight: 500;
          }
        }

        .van-tabbar-item__icon {
          font-size: 24px;
          margin-bottom: 4px;
          color: var(--van-text-color-3);
          transition: color 0.2s ease;
        }

        .van-tabbar-item__text {
          font-size: 12px;
          color: var(--van-text-color-3);
          transition: color 0.2s ease;
          line-height: 1;
          font-weight: 400;
        }
      }
    }
  }

  // 商户模式样式
  .merchant-mode {
    background: #f0f2f5;
    border-top-color: #e8e8e8;

    .footer-tabbar {
      :deep(.van-tabbar-item) {
        color: #646566;

        &.van-tabbar-item--active {
          color: var(--van-primary-color);

          .van-tabbar-item__icon {
            color: var(--van-primary-color);
          }

          .van-tabbar-item__text {
            color: var(--van-primary-color);
          }
        }

        .van-tabbar-item__icon {
          color: #646566;
        }

        .van-tabbar-item__text {
          color: #646566;
        }
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .app-footer {
      background: #1a1a1a;
      border-top-color: #333;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.3);

      .footer-tabbar {
        :deep(.van-tabbar-item) {
          color: #7c7c7c;

          &.van-tabbar-item--active {
            color: var(--van-primary-color);

            .van-tabbar-item__icon {
              color: var(--van-primary-color);
            }

            .van-tabbar-item__text {
              color: var(--van-primary-color);
            }
          }

          .van-tabbar-item__icon {
            color: #7c7c7c;
          }

          .van-tabbar-item__text {
            color: #7c7c7c;
          }
        }
      }
    }

    .merchant-mode {
      background: #2a2a2a;
      border-top-color: #404040;
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.4);
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .app-footer {
      // 在小屏幕上确保完整显示
      height: calc(var(--tabbar-height) + var(--safe-area-inset-bottom, 0px));
    }
  }

  // 大屏幕优化
  @media (min-width: 769px) {
    .app-footer {
      max-width: 768px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 16px 16px 0 0;
    }
  }

  // 动画效果
  .app-footer {
    :deep(.van-tabbar-item) {
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 2px;
        background: var(--van-primary-color);
        border-radius: 1px;
        transition: width 0.2s ease;
      }

      &.van-tabbar-item--active::after {
        width: 20px;
      }
    }
  }
</style>
