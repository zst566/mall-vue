<template>
  <section class="category-promotions" v-if="promotions.length > 0">
    <div class="section-header">
      <h3>{{ category.displayName }}</h3>
      <span class="more" @click="handleViewAll">查看全部</span>
    </div>

    <div class="promotion-scroll">
      <div
        v-for="promotion in promotions"
        :key="promotion.id"
        class="promotion-card"
        @click="handlePromotionClick(promotion)"
      >
        <div class="promotion-image">
          <img
            v-if="getPromotionImage(promotion)"
            :src="getPromotionImage(promotion)"
            :alt="promotion.name || promotion.title"
            class="promo-img"
          />
          <PlaceholderImage v-else width="100%" height="100%" />
        </div>
        <div class="promotion-info">
          <p class="promotion-title">{{ promotion.name || promotion.title }}</p>
          <p class="promotion-desc" v-if="getMerchantLocation(promotion)">
            {{ getMerchantLocation(promotion) }}
          </p>
          <div class="promotion-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ formatPrice(promotion.salePrice || promotion.price) }}</span>
            <span
              class="price-original"
              v-if="promotion.originalPrice && promotion.originalPrice > (promotion.salePrice || promotion.price)"
            >
              ¥{{ formatPrice(promotion.originalPrice) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import type { NavigationCategoryConfig } from '@/types/homepage'
import { formatMoney } from '@/utils/format'

interface Props {
  category: NavigationCategoryConfig
  promotions: any[]
}

const props = defineProps<Props>()
const router = useRouter()

// 获取促销图片
const getPromotionImage = (promotion: any): string | null => {
  if (!promotion.images) return null

  if (Array.isArray(promotion.images) && promotion.images.length > 0) {
    const first = promotion.images[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && 'url' in first) return first.url
  }

  if (typeof promotion.images === 'object' && promotion.images !== null) {
    if ('url' in promotion.images) return promotion.images.url
  }

  return null
}

// 获取商户位置信息
const getMerchantLocation = (promotion: any): string | null => {
  if (promotion.merchant?.location) return promotion.merchant.location
  if (promotion.merchant?.address) return promotion.merchant.address
  if (promotion.merchantName) return promotion.merchantName
  return null
}

// 格式化价格
const formatPrice = (price: number | undefined): string => {
  if (!price && price !== 0) return '0'
  return formatMoney(price)
}

// 处理促销点击
const handlePromotionClick = (promotion: any) => {
  const promotionId = promotion.id || promotion.promotionId
  if (promotionId) {
    router.push(`/promotion/${promotionId}`)
  }
}

// 处理查看全部
const handleViewAll = () => {
  router.push(`/promotions?navigationCategoryId=${props.category.id}`)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.category-promotions {
  margin: 24px 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 12px;

  h3 {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-color-primary;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .more {
    font-size: $font-size-sm;
    color: $primary;
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;

    &::after {
      content: '→';
      font-size: $font-size-lg;
    }

    &:active {
      opacity: 0.8;
    }
  }
}

.promotion-scroll {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding: 0 4px 4px 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}

.promotion-card {
  flex: 0 0 auto;
  width: 160px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;

  &:active {
    transform: scale(0.98);
  }

  &:hover {
    box-shadow: $shadow-base;
  }
}

.promotion-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f5f5;

  .promo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.promotion-info {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.promotion-title {
  font-size: $font-size-base;
  font-weight: 700;
  color: $text-color-primary;
  margin: 0 0 4px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promotion-desc {
  font-size: $font-size-xs;
  font-weight: 400;
  color: $text-color-tertiary;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promotion-price {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price-symbol {
  font-size: $font-size-sm;
  font-weight: 700;
  color: $primary;
}

.price-value {
  font-size: $font-size-lg;
  font-weight: 800;
  color: $primary;
}

.price-original {
  font-size: $font-size-xs;
  color: #999;
  text-decoration: line-through;
}

@media (max-width: 768px) {
  .category-promotions {
    margin: 20px 8px;
  }

  .section-header {
    padding: 0 0 10px;

    h3 {
      font-size: $font-size-lg;
    }
  }

  .promotion-card {
    width: 140px;
  }

  .promotion-info {
    padding: 10px;
  }

  .promotion-title {
    font-size: $font-size-sm;
  }
}

@media (prefers-color-scheme: dark) {
  .promotion-card {
    background: #1e1e1e;
  }

  .promotion-image {
    background: #2a2a2a;
  }

  .section-header h3 {
    color: #e0e0e0;
  }

  .promotion-title {
    color: #e0e0e0;
  }

  .promotion-desc {
    color: #a0a0a0;
  }
}
</style>

