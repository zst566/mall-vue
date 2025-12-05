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
          <span 
            class="price-symbol"
            :class="{ 'price-symbol-subsidy': isMallSubsidy(promotion) }"
          >
            ¥
          </span>
          <!-- 统一所有主要金额：拆分整数和小数部分，小数位缩小50% -->
          <span 
            class="price-value"
            :class="{ 'price-value-subsidy': isMallSubsidy(promotion) }"
          >
            <span class="price-integer">{{ getPriceParts(promotion).integer }}</span>
            <span v-if="getPriceParts(promotion).decimal" class="price-decimal">{{ getPriceParts(promotion).decimal }}</span>
          </span>
          <!-- 划线金额：保持原样，不应用角分位缩小规则 -->
          <span
            class="price-original"
            v-if="promotion.originalPrice && promotion.originalPrice > getDisplayPrice(promotion)"
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

// 判断是否为商场补贴模式
const isMallSubsidy = (promotion: Promotion): boolean => {
  const variant = promotion.defaultVariant
  if (!variant) return false
  return variant.promotionMode === 'mall_subsidy' && (variant.subsidyAmount || 0) > 0
}

// 格式化价格
const formatPrice = (price: number | undefined | null): string => {
  if (price === null || price === undefined || (typeof price !== 'number') || isNaN(price)) {
    return formatMoney(0)
  }
  return formatMoney(price)
}

// 获取显示价格（优先使用 finalAmount）
const getDisplayPrice = (promotion: Promotion): number => {
  // 优先使用 defaultVariant 的 finalAmount
  if (promotion.defaultVariant?.finalAmount != null) {
    return promotion.defaultVariant.finalAmount
  }
  // 其次使用 promotion 的 salePrice（后端已计算好）
  if (promotion.salePrice != null) {
    return promotion.salePrice
  }
  // 最后使用兼容字段 price
  return promotion.price || 0
}

// 拆分价格为整数和小数部分（用于补贴模式显示）
const getPriceParts = (promotion: Promotion): { integer: string; decimal: string } => {
  const price = getDisplayPrice(promotion)
  const formatted = formatMoney(price)
  // 格式化的价格可能是 "1,234.56" 这样的格式
  const parts = formatted.split('.')
  if (parts.length === 2) {
    return {
      integer: parts[0], // "1,234"
      decimal: '.' + parts[1] // ".56"
    }
  }
  // 如果没有小数部分，返回整数部分
  return {
    integer: formatted,
    decimal: ''
  }
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
  
  &.price-symbol-subsidy {
    color: #ee0a24; // 红色
  }
}

// 统一所有主要金额样式：拆分整数和小数部分，小数位缩小50%
.price-value {
  font-size: $font-size-lg;
  font-weight: 800;
  color: $primary;
  display: inline-flex;
  align-items: baseline;
  
  .price-integer {
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
  }
  
  .price-decimal {
    font-size: 50%; // 角分位字体缩小50%
    font-weight: inherit;
    color: inherit;
  }
  
  // 补贴模式：红字加粗
  &.price-value-subsidy {
    color: #ee0a24; // 红色
  }
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
