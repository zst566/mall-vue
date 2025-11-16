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

// 加载首页数据
const loadHomepageData = async () => {
  try {
    // 并行加载横幅和导航分类
    const [bannersData, categoriesData] = await Promise.all([
      homepageService.getBanners(),
      homepageService.getNavigationCategories(),
    ])

    banners.value = bannersData
    navigationCategories.value = categoriesData

    // 为每个导航分类加载促销列表
    const promotionPromises = categoriesData.map(async (category) => {
      const promotions = await homepageService.getCategoryPromotions(
        category.id,
        category.displayCount || 3
      )
      return { categoryId: category.id, promotions }
    })

    const promotionResults = await Promise.all(promotionPromises)
    const map: Record<string, any[]> = {}
    promotionResults.forEach(({ categoryId, promotions }) => {
      map[categoryId] = promotions
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

.home-page {
  padding-bottom: 24px;
  background: linear-gradient(180deg, #f8f9fb 0%, #ffffff 100%);
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
    background: linear-gradient(180deg, #1a1a1a 0%, #121212 100%);
  }
}
</style>
