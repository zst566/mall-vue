<template>
  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
    <div class="home-page">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <van-loading type="spinner" size="24px">加载中...</van-loading>
    </div>
    
    <!-- 内容区域 -->
    <template v-else>
      <!-- 错误状态 -->
      <div v-if="hasError" class="error-container">
        <van-empty description="加载失败">
          <template #image>
            <van-icon name="warning-o" size="48px" color="#ee0a24" />
          </template>
          <van-button type="primary" @click="handleRetry">重试</van-button>
        </van-empty>
      </div>
      
      <!-- 正常内容 -->
      <template v-else>
        <!-- 顶部横幅 -->
        <PromotionBanner :banners="banners" :full-width="bannerFullWidth" />

        <!-- 分类导航 -->
        <CategoryNavigation :categories="navigationCategories" />

        <!-- 按分类分组的促销列表 -->
        <CategoryPromotions
          v-for="category in navigationCategories"
          :key="category.id"
          :category="category"
          :promotions="category.promotions || []"
        />
      </template>
    </template>
    
    <!-- 空状态 -->
    <div v-if="!isLoading && !hasError && navigationCategories.length === 0" class="empty-state">
      <van-empty description="暂无数据" />
    </div>
    </div>
  </van-pull-refresh>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { homepageService } from '@/services/homepage'
import type { HomepageBannerConfig, NavigationCategoryConfig } from '@/types/homepage'
import type { Promotion } from '@/types/promotion'
import PromotionBanner from '@/components/customer/PromotionBanner.vue'
import CategoryNavigation from '@/components/customer/CategoryNavigation.vue'
import CategoryPromotions from '@/components/customer/CategoryPromotions.vue'
import { useAppStore } from '@/stores/app'
import { showToast } from 'vant'
import { ApiErrorHandler } from '@/services/api'

// 数据
const banners = ref<HomepageBannerConfig[]>([])
const navigationCategories = ref<NavigationCategoryConfig[]>([])
// 是否使用贯穿式展示首页 Banner（左右不留白）
const bannerFullWidth = ref(true)
// 常量
const MAX_RETRY = 3

// 状态
const appStore = useAppStore()
const isLoading = ref(false)
const retryCount = ref(0)
const hasError = ref(false)
const refreshing = ref(false)

// 加载首页数据（优化版：使用聚合接口，一次请求所有数据）
const loadHomepageData = async () => {
  try {
    isLoading.value = true
    hasError.value = false
    
    // 使用聚合接口，一次性获取所有首页数据
    const data = await homepageService.getHomepageData()

    // 解构数据并赋值
    banners.value = data.banners
    navigationCategories.value = data.navigationCategories
    bannerFullWidth.value = data.carouselConfig?.bannerFullWidth ?? true


    // 成功时重置重试计数
    retryCount.value = 0
  } catch (error: any) {
    console.error('加载首页数据失败:', error)
    hasError.value = true
    
    // 局部错误处理：显示 Toast
    const errorMessage = ApiErrorHandler.handleApiError(error)
    showToast({
      message: errorMessage,
      type: 'fail',
      duration: 2000
    })
    
    // 自动重试（最多3次）
    if (retryCount.value < MAX_RETRY) {
      retryCount.value++
      showToast({
        message: `加载失败，${2}秒后自动重试...`,
        type: 'loading',
        duration: 2000
      })
      setTimeout(() => {
        loadHomepageData()
      }, 2000)
    } else {
      // 重试失败后，使用全局错误处理
      appStore.setError({
        code: error?.response?.status || 500,
        message: '加载首页数据失败，请刷新页面重试'
      })
      showToast({
        message: '加载失败，请检查网络后刷新页面',
        type: 'fail',
        duration: 3000
      })
    }
  } finally {
    isLoading.value = false
  }
}


// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  try {
    await loadHomepageData()
  } finally {
    refreshing.value = false
  }
}

// 手动重试
const handleRetry = () => {
  retryCount.value = 0
  hasError.value = false
  loadHomepageData()
}

onMounted(() => {
  loadHomepageData()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.home-page {
  padding-bottom: 24px;
  // 使用主题颜色背景渐变，跟随系统配置
  background: var(--theme-bg-gradient, $glass-bg-gradient);
  background-attachment: fixed;
  background-size: cover;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

@media (max-width: 768px) {
  .home-page {
    padding-bottom: 16px;
  }
}

@media (prefers-color-scheme: dark) {
  .home-page {
    // 暗色模式使用深色渐变背景
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    background-attachment: fixed;
    background-size: cover;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 40px 20px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
}
</style>
