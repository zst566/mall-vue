<template>
  <div class="product-info" v-if="items && items.length > 0">
    <h3>促销活动信息</h3>
    <div class="product-item" v-for="item in items" :key="item.id" @click="handleProductClick(item)">
      <img :src="getProductImageUrl(item.productImage)" :alt="item.productName" class="product-image" />
      <div class="product-details">
        <h4 class="product-name">{{ item.productName }}</h4>
        <div class="product-specs">
          <span>数量：{{ item.quantity }}</span>
          <span>原价：¥{{ formatMoney((item as any).originalPrice || 0) }}</span>
        </div>
        <div class="merchant-info" v-if="(item as any).merchantName || (item as any).merchantAddress || (item as any).merchantFloor">
          <div class="merchant-name" v-if="(item as any).merchantName">
            <van-icon name="shop-o" class="merchant-icon" />
            <span>{{ (item as any).merchantName }}</span>
          </div>
          <div class="merchant-location" v-if="(item as any).merchantAddress || (item as any).merchantFloor">
            <van-icon name="location-o" class="location-icon" />
            <span v-if="(item as any).merchantAddress">{{ (item as any).merchantAddress }}</span>
            <span v-if="(item as any).merchantFloor" class="floor-text">{{ (item as any).merchantFloor }}</span>
          </div>
        </div>
      </div>
      <div class="product-price">¥{{ formatMoney(((item as any).finalPrice ?? item.price) * item.quantity) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatMoney } from '@/utils/format'

interface OrderItem {
  id: string
  productName: string
  productImage?: string | null
  quantity: number
  price: number
  finalPrice?: number // 实付单价（补贴后的单价）
  originalPrice?: number
  merchantName?: string
  merchantAddress?: string
  merchantFloor?: string
}

interface Props {
  items: OrderItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'product-click': [item: OrderItem]
}>()

// 获取促销商品图片URL（兼容相对路径和完整URL）
const getProductImageUrl = (url: string | undefined | null): string => {
  if (!url) return '/images/default-product.jpg'
  // 已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 已经是 /api 开头，直接返回
  if (url.startsWith('/api/')) {
    return url
  }
  // 以 / 开头的相对路径，拼接 API 基础地址
  if (url.startsWith('/')) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    return `${baseURL}${url}`
  }
  // 其它情况，原样返回（例如 OSS 完整地址或兼容旧数据）
  return url
}

// 处理商品点击
const handleProductClick = (item: OrderItem) => {
  emit('product-click', item)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.product-info {
  @include glassmorphism-card(base);
  padding: 20px;
  margin: 16px;
  margin-bottom: 12px;
  border-radius: 0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #323233;
    margin: 0 0 16px 0;
  }
}

.product-item {
  cursor: pointer;
  transition: all 0.2s;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  
  &:active {
    background-color: #f7f8fa;
  }
  
  display: flex;
  align-items: center;
  gap: 12px;

  .product-image {
    width: 72px;
    height: 72px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .product-details {
    flex: 1;
    min-width: 0;

    .product-name {
      font-size: 15px;
      color: #323233;
      margin-bottom: 8px;
      line-height: 1.4;
      font-weight: 500;
    }

    .product-specs {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #969799;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .merchant-info {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #ebedf0;

      .merchant-name {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #323233;
        margin-bottom: 4px;
        font-weight: 500;

        .merchant-icon {
          font-size: 14px;
          color: var(--primary-color);
        }
      }

      .merchant-location {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #646566;
        flex-wrap: wrap;

        .location-icon {
          font-size: 13px;
          color: #969799;
          flex-shrink: 0;
        }

        .floor-text {
          margin-left: 4px;
          padding: 1px 6px;
          background: var(--primary-color-alpha-10, rgba(25, 137, 250, 0.1));
          color: var(--primary-color);
          border-radius: 8px;
          font-size: 11px;
        }
      }
    }
  }

  .product-price {
    font-size: 17px;
    font-weight: 600;
    color: #ee0a24;
    flex-shrink: 0;
  }
}
</style>

