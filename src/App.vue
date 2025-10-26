<template>
  <div id="app" :class="{ 'merchant-mode': appStore.isMerchantMode }">
    <!-- 应用头部 -->
    <AppHeader v-if="!appStore.isLoading && !route.meta.hideHeader" />

    <!-- 主要内容区域 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 应用底部 -->
    <AppFooter v-if="!appStore.isLoading && !route.meta.hideFooter" />

    <!-- 版本切换组件 -->
    <VersionSwitcher />

    <!-- 全局加载组件 -->
    <LoadingSpinner :visible="appStore.isLoading" />

    <!-- 全局错误提示组件 -->
    <ErrorMessage
      :visible="!!appStore.error"
      :error="appStore.error"
      @close="appStore.clearError()"
    />
  </div>
</template>

<script setup lang="ts">
  import { onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useAppStore } from '@/stores/app'
  import AppHeader from '@/components/common/AppHeader.vue'
  import AppFooter from '@/components/common/AppFooter.vue'
  import VersionSwitcher from '@/components/common/VersionSwitcher.vue'
  import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
  import ErrorMessage from '@/components/common/ErrorMessage.vue'

  // 路由和状态管理
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const appStore = useAppStore()

  // 初始化应用
  onMounted(async () => {
    try {
      // 初始化应用状态
      appStore.setLoading(true)

      // 初始化认证状态
      authStore.initializeAuth()

      // 初始化应用
      const initResult = await appStore.initializeApp()
      if (!initResult.success) {
        throw new Error(initResult.message)
      }

      // 如果有token，尝试获取用户信息
      if (authStore.isLoggedIn) {
        const userInfoResult = await authStore.getUserInfo()
        if (!userInfoResult.success) {
          console.warn('获取用户信息失败:', userInfoResult.message)
          // Token失效，清除本地token
          authStore.logout()
        }
      }

      // 监听路由变化
      watch(
        () => route.path,
        newPath => {
          // 根据路径更新版本
          if (newPath.startsWith('/merchant')) {
            appStore.switchToMerchant()
          } else {
            appStore.switchToCustomer()
          }
        },
        { immediate: true }
      )
    } catch (error) {
      console.error('应用初始化失败:', error)
      appStore.setError(error)
    } finally {
      appStore.setLoading(false)
    }
  })
</script>

<style lang="scss">
  #app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #f7f8fa;
    color: #323233;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* 启用GPU加速，提升渲染清晰度 */
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
    /* 优化字体渲染 */
    text-rendering: optimizeLegibility;
    /* 防止字体模糊 */
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    /* 确保内容不会溢出 */
    overflow-x: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .app-main {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    /* 为底部导航预留空间 */
    padding-bottom: calc(var(--tabbar-height) + var(--safe-area-inset-bottom, 0px));
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;

    /* 移动端隐藏滚动条 */
    @media (max-width: 768px) {
      /* 隐藏webkit滚动条 */
      &::-webkit-scrollbar {
        display: none;
      }

      /* Firefox */
      scrollbar-width: none;

      /* IE 和 Edge */
      -ms-overflow-style: none;
    }
  }

  // 商户模式样式
  .merchant-mode {
    background-color: #f0f2f5;
  }

  // 禁用双击缩放
  * {
    touch-action: manipulation;
  }

  // 页面过渡动画
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    #app {
      background-color: #1a1a1a;
      color: #fff;

      &.merchant-mode {
        background-color: #2a2a2a;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    #app {
      /* 在小屏幕上确保完整视口 */
      min-height: 100vh;
      min-height: -webkit-fill-available;
    }
  }

  // 大屏幕优化
  @media (min-width: 769px) {
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    #app {
      max-width: 768px;
      width: 768px;
      height: 100vh;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
    }
  }
</style>
