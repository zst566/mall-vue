<template>
  <div class="home-page">
    <!-- 顶部横幅 -->
    <PromotionBanner :banners="banners" />

    <!-- 分类导航 -->
    <CategoryNavigation :categories="navigationCategories" />

    <!-- 按分类分组的促销列表 -->
    <CategoryPromotions
      v-for="category in navigationCategories"
      :key="category.id"
      :category="category"
      :promotions="categoryPromotionsMap[category.id] || []"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { homepageService } from '@/services/homepage'
import type { HomepageBannerConfig, NavigationCategoryConfig } from '@/types/homepage'
import PromotionBanner from '@/components/customer/PromotionBanner.vue'
import CategoryNavigation from '@/components/customer/CategoryNavigation.vue'
import CategoryPromotions from '@/components/customer/CategoryPromotions.vue'

// 数据
const banners = ref<HomepageBannerConfig[]>([])
const navigationCategories = ref<NavigationCategoryConfig[]>([])
const categoryPromotionsMap = ref<Record<string, any[]>>({})

// 加载首页数据（优化版：使用聚合接口，一次请求所有数据）
const loadHomepageData = async () => {
  try {
    // 使用聚合接口，一次性获取所有首页数据
    const data = await homepageService.getHomepageData()

    // 解构数据并赋值
    banners.value = data.banners
    navigationCategories.value = data.navigationCategories

    // 构建促销映射表（前端不再需要单独请求促销数据）
    const map: Record<string, any[]> = {}
    data.navigationCategories.forEach((category) => {
      map[category.id] = category.promotions || []
    })
    categoryPromotionsMap.value = map
  } catch (error) {
    console.error('加载首页数据失败:', error)
  }
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
</style>
