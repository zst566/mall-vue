<template>
  <div 
    class="promotion-container"
    :class="{ 'promotion-vertical': layout === 'vertical', 'promotion-horizontal': layout !== 'vertical' }"
  >
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
          :alt="(promotion.name || promotion.title) || ''"
          loading="lazy"
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
            v-if="promotion.originalPrice && promotion.originalPrice > ((promotion.salePrice ?? promotion.price ?? 0))"
          >
            ¥{{ formatPrice(promotion.originalPrice) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import type { Promotion } from '@/types/promotion'
import { formatMoney } from '@/utils/format'

interface Props {
  promotions: Promotion[]
  layout?: 'horizontal' | 'vertical'
}

const props = defineProps<Props>()
const router = useRouter()

// 获取促销图片
const getPromotionImage = (promotion: Promotion): string | undefined => {
  if (!promotion.images) return undefined

  if (Array.isArray(promotion.images) && promotion.images.length > 0) {
    const first = promotion.images[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && 'url' in first) return first.url as string
  }

  if (typeof promotion.images === 'object' && promotion.images !== null) {
    if ('url' in promotion.images) return promotion.images.url as string
  }

  return undefined
}

// 获取商户位置信息
const getMerchantLocation = (promotion: Promotion): string | undefined => {
  if (promotion.merchant?.location) return promotion.merchant.location
  if (promotion.merchant?.address) return promotion.merchant.address
  if (promotion.merchantName) return promotion.merchantName
  return undefined
}

// 格式化价格
const formatPrice = (price: number | undefined | null): string => {
  if (price === null || price === undefined || (typeof price !== 'number') || isNaN(price)) {
    return formatMoney(0)
  }
  return formatMoney(price)
}

// 处理促销点击
const handlePromotionClick = (promotion: Promotion) => {
  const promotionId = promotion.id || promotion.promotionId
  if (promotionId) {
    router.push(`/promotion/${promotionId}`)
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.promotion-container {
  &.promotion-horizontal {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding: 0 4px 4px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &.promotion-vertical {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 0;
  }
}

.promotion-card {
  @include glassmorphism-card(base);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;

  .promotion-horizontal & {
    flex: 0 0 auto;
    width: 160px;
  }

  .promotion-vertical & {
    width: 100%;
    flex-direction: row;
    gap: 12px;
    padding: 12px;

    .promotion-image {
      width: 120px;
      height: 120px;
      flex-shrink: 0;
      aspect-ratio: 1;
    }

    .promotion-info {
      flex: 1;
      padding: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }

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
  line-clamp: 2;
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
  line-clamp: 1;
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
  .promotion-card {
    .promotion-horizontal & {
      width: 140px;
    }

    .promotion-vertical & {
      flex-direction: column;
      padding: 12px;

      .promotion-image {
        width: 100%;
        height: auto;
        aspect-ratio: 1;
      }

      .promotion-info {
        padding: 12px 0 0 0;
      }
    }
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

  .promotion-title {
    color: #e0e0e0;
  }

  .promotion-desc {
    color: #a0a0a0;
  }
}
</style>
