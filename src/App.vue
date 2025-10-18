<template>
  <div id="app" :class="{ 'merchant-mode': appStore.isMerchantMode }">
    <!-- 应用头部 -->
    <AppHeader />

    <!-- 主要内容区域 -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- 应用底部 -->
    <AppFooter />

    <!-- 版本切换组件 -->
    <VersionSwitcher />

    <!-- 全局加载组件 -->
    <LoadingSpinner />

    <!-- 全局错误提示组件 -->
    <ErrorMessage />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import VersionSwitcher from '@/components/common/VersionSwitcher.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

// 状态管理
const authStore = useAuthStore()
const appStore = useAppStore()

// 初始化应用
onMounted(async () => {
  // 检查本地存储的token
  const savedToken = localStorage.getItem('token')
  if (savedToken) {
    authStore.token = savedToken
  }

  // 检查微信小程序参数
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const version = urlParams.get('version')

  if (token) {
    authStore.token = token
    localStorage.setItem('token', token)
  }

  if (version) {
    appStore.currentVersion = version as 'customer' | 'merchant'
  }

  // 如果有token，尝试获取用户信息
  if (authStore.token) {
    try {
      // 这里应该调用获取用户信息的API
      // await authStore.getUserInfo()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // Token失效，清除本地token
      authStore.logout()
    }
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-main {
  flex: 1;
  padding-bottom: 60px; /* 底部导航栏高度 */
}

// 商户模式样式
.merchant-mode {
  background-color: #f0f2f5;
}

// 响应式设计
@media (max-width: 768px) {
  .app-main {
    padding-bottom: 60px;
  }
}

// 禁用双击缩放
* {
  touch-action: manipulation;
}
</style>