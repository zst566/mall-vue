<template>
  <div class="promotion-info">
    <div class="price-section">
      <div class="current-price">
        <span class="price-symbol">¥</span>
        <span class="price-value">
          <span class="price-integer">{{ priceParts.integer }}</span>
          <span class="price-decimal">.{{ priceParts.decimal }}</span>
        </span>
      </div>
      <!-- 商场补贴模式下：用补贴后实付价作为主价格，原售价作为划线价 -->
      <div v-if="isMallSubsidy" class="subsidy-original-price">
        <span class="original-symbol">¥</span>
        <span class="original-value">
          {{ formatPrice(salePrice) }}
        </span>
      </div>
      <!-- 非商场补贴模式下，展示原价和节省金额 -->
      <div
        class="original-price"
        v-else-if="originalPrice && originalPrice > salePrice && selectedVariant"
      >
        <span class="original-symbol">¥</span>
        <span class="original-value">{{ formatPrice(originalPrice) }}</span>
        <span class="discount-text">
          省¥{{ formatPrice(originalPrice - salePrice) }}
        </span>
      </div>
    </div>

    <h2 class="promotion-name">{{ promotion.name }}</h2>
    
    <!-- 服务特色标签（标题下方、价格上方） -->
    <div class="service-tags" v-if="tags && tags.length > 0">
      <van-popover
        v-for="tag in tags"
        :key="tag.id"
        v-model:show="tagPopoverVisible[tag.id]"
        :actions="[]"
        :placement="getPopoverPlacement(tag.id)"
        theme="dark"
        :offset="getPopoverOffset(tag.id)"
        :class="`tag-popover-${tag.id}`"
      >
        <template #reference>
          <span
            class="service-tag"
            :ref="el => setTagRef(tag.id, el)"
            @click.stop="handleTagClick(tag.id)"
          >
            {{ tag.name }}
          </span>
        </template>
        <div class="tag-popover-content" style="padding: 12px 16px;">
          <div class="tag-name">{{ tag.name }}</div>
          <div class="tag-description" v-if="tag.description">{{ tag.description }}</div>
          <div class="tag-description" v-else>暂无说明</div>
        </div>
      </van-popover>
    </div>

    <p class="promotion-desc" v-if="promotion.description">{{ promotion.description }}</p>

    <!-- 规格选择（多规格时显示） -->
    <VariantSelector
      v-if="variants.length > 1"
      :variants="variants"
      :model-value="selectedVariant"
      @update:model-value="handleVariantChange"
      :disabled="!isActivityActive"
    />

    <div class="promotion-meta">
      <div class="meta-item meta-item-quantity">
        <span class="meta-label">剩余数量</span>
        <span class="meta-value">{{ leftQuantity }} 件</span>
      </div>
      <div class="meta-item meta-item-quantity">
        <span class="meta-label">已售数量</span>
        <span class="meta-value">{{ selectedVariant?.soldQuantity || promotion.soldQuantity || 0 }} 件</span>
      </div>
      <div class="meta-item meta-item-time">
        <span class="meta-label">活动时间</span>
        <span class="meta-value">{{ formatDateRange(promotion.startTime, promotion.endTime) }}</span>
      </div>
    </div>

    <!-- 商铺信息 -->
    <div class="shop-info" v-if="promotion.shop && (promotion.shop.shopCode || promotion.shop.floor)">
      <div class="shop-info-header">
        <van-icon name="shop-o" class="shop-icon" />
        <span class="shop-info-title">商铺信息</span>
      </div>
      <div class="shop-info-content">
        <div class="shop-info-item">
          <span class="shop-info-label" v-if="promotion.shop.shopCode">商铺编号</span>
          <span class="shop-info-value" v-if="promotion.shop.shopCode">{{ promotion.shop.shopCode }}</span>
          <span class="shop-info-separator" v-if="promotion.shop.shopCode && promotion.shop.floor">·</span>
          <span class="shop-info-label" v-if="promotion.shop.floor">楼层</span>
          <span class="shop-info-value" v-if="promotion.shop.floor">{{ promotion.shop.floor }}</span>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import VariantSelector from '@/components/customer/VariantSelector.vue'
import { usePromotionTags } from '@/composables/usePromotionTags'
import { formatDateRange } from '@/utils/promotionHelpers'
import type { PromotionDetail, PromotionVariant, PromotionTag } from '@/types/promotion'
import { ref, watch, computed } from 'vue'

interface Props {
  promotion: PromotionDetail
  selectedVariant: PromotionVariant | null
  variants: PromotionVariant[]
  tags: PromotionTag[]
  isActivityActive: boolean
  leftQuantity: number
  // 价格相关
  isMallSubsidy: boolean
  finalAmount: number
  salePrice: number
  originalPrice: number
  formatPrice: (price: number) => string
}

interface Emits {
  (e: 'update:selectedVariant', variant: PromotionVariant | null): void
  (e: 'tag-click', tagId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 标签管理
const tagsRef = ref(props.tags)
const { tagPopoverVisible, getPopoverPlacement, getPopoverOffset, showTagDescription, setTagRef } = usePromotionTags(tagsRef)

// 规格变更
const handleVariantChange = (variant: PromotionVariant | null) => {
  emit('update:selectedVariant', variant)
}

// 标签点击
const handleTagClick = (tagId: string) => {
  showTagDescription(tagId)
  emit('tag-click', tagId)
}

// 监听 tags 变化
watch(() => props.tags, (newTags) => {
  tagsRef.value = newTags
}, { deep: true })

// 拆分主要金额为整数部分和角分部分
const priceParts = computed(() => {
  const price = props.isMallSubsidy ? props.finalAmount : props.salePrice
  const priceStr = props.formatPrice(price)
  // 处理可能包含千分位分隔符的情况，如 "1,234.56"
  const parts = priceStr.replace(/,/g, '').split('.')
  return {
    integer: parts[0] || '0',
    decimal: parts[1] || '00'
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

// 促销活动基本信息
.promotion-info {
  @include glassmorphism-card(base);
  padding: 16px;
  margin: 16px;
  margin-bottom: 12px;

  .price-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;

    .current-price {
      display: flex;
      align-items: baseline;

      .price-symbol {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-dark);
      }

      .price-value {
        font-size: 32px;
        font-weight: 800;
        color: var(--primary-dark);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 4px rgba(0, 0, 0, 0.05);
        display: inline-flex;
        align-items: baseline;
      }

      .price-integer {
        font-size: 32px;
        font-weight: 800;
      }

      .price-decimal {
        font-size: 16px; // 50% of 32px
        font-weight: 800;
      }
    }

    // 商场补贴模式下的划线原价
    .subsidy-original-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-left: 2px;

      .original-symbol {
        font-size: 14px;
        color: var(--van-text-color-3);
      }

      .original-value {
        font-size: 16px;
        color: var(--van-text-color-3);
        text-decoration: line-through;
      }
    }

    .original-price {
      display: flex;
      align-items: baseline;
      gap: 8px;

      .original-symbol {
        font-size: 14px;
        color: var(--van-text-color-3);
      }

      .original-value {
        font-size: 18px;
        color: var(--van-text-color-3);
        text-decoration: line-through;
      }

      .discount-text {
        font-size: 12px;
        font-weight: 600;
        color: white;
        background-color: var(--primary-color);
        padding: 4px 8px;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        display: inline-block;
        line-height: 1.2;
      }
    }
  }

  .service-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }

  .service-tag {
    display: inline-block;
    padding: 4px 12px;
    background-color: #f0f0f0;
    border-radius: 12px;
    font-size: 12px;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;
  }

  .service-tag:hover {
    background-color: #e0e0e0;
  }

  .service-tag:active {
    background-color: #d0d0d0;
  }

  // 优化 Popover 在视口范围内的显示
  :deep(.van-popover[class*="tag-popover-"]) {
    max-width: min(280px, calc(100vw - 20px)) !important; // 左右各留10px边距
  }

  // Popover 内容容器样式
  :deep(.van-popover__wrapper) {
    .van-popover__content {
      max-width: 100%;
      word-wrap: break-word;
      word-break: break-word;
      padding: 0 !important; // 移除默认 padding，使用内容区域的 padding
      box-sizing: border-box !important;
    }
  }

  // 内容区域样式（padding 通过内联样式设置）
  .tag-popover-content {
    min-width: 120px;
    max-width: 100%;
    word-wrap: break-word;
    word-break: break-word;
    box-sizing: border-box;
  }

  .tag-name {
    font-weight: bold;
    margin-bottom: 8px !important; // 增加标题和描述之间的间距
    margin-top: 0 !important; // 确保顶部没有额外间距
    color: #fff;
    font-size: 14px;
    line-height: 1.4;
    padding: 0;
  }

  .tag-description {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
    white-space: normal; // 允许换行
    margin: 0 !important; // 确保没有额外间距
    padding: 0;
  }

  .promotion-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--van-text-color);
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .promotion-desc {
    font-size: 14px;
    color: var(--van-text-color-2);
    line-height: 1.6;
    margin: 0 0 16px 0;
  }

  .promotion-meta {
    display: flex;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--van-border-color);

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 0 0 auto;

      .meta-label {
        font-size: 12px;
        color: var(--van-text-color-3);
      }

      .meta-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--van-text-color);
        word-break: keep-all;
        white-space: nowrap;
      }

      &.meta-item-quantity {
        flex: 0 0 80px;
        min-width: 70px;
      }

      &.meta-item-time {
        flex: 1 1 auto;
        min-width: 0;
      }
    }
  }

  .shop-info {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--van-border-color);

    .shop-info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .shop-icon {
        font-size: 18px;
        color: var(--primary-color);
      }

      .shop-info-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);
      }
    }

    .shop-info-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      .shop-info-item {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 12px;
        background-color: var(--van-background-color-light);
        border-radius: 8px;

        .shop-info-label {
          font-size: 14px;
          color: var(--van-text-color-2);
          white-space: nowrap;
        }

        .shop-info-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--van-text-color);
          white-space: nowrap;
        }

        .shop-info-separator {
          font-size: 14px;
          color: var(--van-text-color-3);
          margin: 0 4px;
        }
      }
    }
  }
}
</style>






