<template>
  <section class="category-promotions" v-if="promotions.length > 0">
    <!-- Header 组件 -->
    <CategoryPromotionHeader :category="category" />

    <!-- Banner 组件 -->
    <CategoryPromotionBanner
      v-if="category.banners && category.banners.length > 0"
      :banners="category.banners"
      :breathing-duration="category.breathingDuration"
      :category-display-name="category.displayName"
    />

    <!-- List 组件 -->
    <CategoryPromotionList
      :promotions="promotions"
      :layout="category.layout"
    />
  </section>
</template>
<script setup lang="ts">
import type { NavigationCategoryConfig } from '@/types/homepage'
import type { Promotion } from '@/types/promotion'
import CategoryPromotionHeader from './CategoryPromotionHeader.vue'
import CategoryPromotionBanner from './CategoryPromotionBanner.vue'
import CategoryPromotionList from './CategoryPromotionList.vue'

interface Props {
  category: NavigationCategoryConfig
  promotions: Promotion[]
}

defineProps<Props>()
</script>
<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.category-promotions {
  margin: 24px 12px;
}

@media (max-width: 768px) {
  .category-promotions {
    margin: 20px 8px;
  }
}
</style>