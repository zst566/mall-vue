<template>
  <div class="product-list">
    <!-- 加载状态 -->
    <div v-if="isLoading && products.length === 0" class="loading-container">
      <van-loading type="spinner" size="24px">加载中...</van-loading>
    </div>

    <!-- 空状态 -->
    <div v-else-if="products.length === 0 && !isLoading" class="empty-container">
      <van-empty :description="emptyDescription" />
      <div v-if="showRetry" class="retry-button">
        <van-button type="primary" @click="$emit('retry')">重试</van-button>
      </div>
    </div>

    <!-- 商品网格 -->
    <div v-else class="products-grid" :class="{ 'column-2': columnCount === 2, 'column-3': columnCount === 3 }">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :show-add-to-cart="showAddToCart"
        @buy-now="$emit('buy-now', product)"
        @add-to-cart="$emit('add-to-cart', product)"
      />
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !isLoading" class="load-more">
      <van-loading type="spinner" size="20px">
        {{ loadingText }}
      </van-loading>
    </div>

    <!-- 没有更多数据 -->
    <div v-if="!hasMore && products.length > 0" class="no-more">
      <span class="no-more-text">{{ noMoreText }}</span>
    </div>

    <!-- 列表模式切换 -->
    <div v-if="showViewModeToggle" class="view-mode-toggle">
      <van-button
        :type="viewMode === 'grid' ? 'primary' : 'default'"
        size="small"
        icon="grid-o"
        @click="viewMode = 'grid'"
        circle
      />
      <van-button
        :type="viewMode === 'list' ? 'primary' : 'default'"
        size="small"
        icon="list-o"
        @click="viewMode = 'list'"
        circle
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ProductCard from './ProductCard.vue'
import type { Product } from '../types'

interface Props {
  products: Product[]
  isLoading?: boolean
  hasMore?: boolean
  emptyText?: string
  loadingText?: string
  noMoreText?: string
  showRetry?: boolean
  showAddToCart?: boolean
  showViewModeToggle?: boolean
  viewMode?: 'grid' | 'list'
  columnCount?: number
}

interface Emits {
  (e: 'retry'): void
  (e: 'buy-now', product: Product): void
  (e: 'add-to-cart', product: Product): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasMore: true,
  emptyText: '暂无相关商品',
  loadingText: '加载更多',
  noMoreText: '没有更多商品了',
  showRetry: true,
  showAddToCart: true,
  showViewModeToggle: false,
  viewMode: 'grid',
  columnCount: 2
})

const emit = defineEmits<Emits>()

// 计算空状态描述
const emptyDescription = computed(() => {
  return props.emptyText
})

// 处理商品加载完成事件
const handleProductLoaded = () => {
  // 可以在这里处理图片加载完成后的操作
}

// 监听滚动事件实现自动加载更多
const handleScroll = () => {
  if (props.hasMore && !props.isLoading) {
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      emit('load-more')
    }
  }
}
</script>

<style lang="scss" scoped>
.product-list {
  width: 100%;
  min-height: 200px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 40px 0;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px 0;

  .retry-button {
    margin-top: 16px;
  }
}

.products-grid {
  display: grid;
  gap: 12px;
  padding: 0 4px;

  &.column-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &.column-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  // 列表模式样式
  &.list-mode {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .product-card {
      display: flex;
      flex-direction: row;
      background: var(--van-background-2);
      border-radius: var(--van-radius-lg);
      overflow: hidden;

      .product-image {
        width: 120px;
        height: 120px;
        flex-shrink: 0;
      }

      .product-info {
        flex: 1;
        padding: 12px;

        .product-name {
          height: auto;
          margin-bottom: 8px;
        }

        .product-desc {
          height: auto;
          margin-bottom: 8px;
        }

        .price-section {
          margin-bottom: 12px;
        }

        .action-section {
          margin-bottom: 8px;
        }

        .product-meta {
          display: block;
          padding-top: 8px;
          border-top: 1px solid var(--van-border-color);

          .meta-item {
            display: flex;
            align-items: center;
            margin-bottom: 4px;

            &:last-child {
              margin-bottom: 0;
            }

            .meta-text {
              max-width: none;
            }
          }
        }
      }
    }
  }
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  color: var(--van-text-color-2);
  font-size: 14px;
}

.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;

  .no-more-text {
    color: var(--van-text-color-3);
    font-size: 14px;
  }
}

.view-mode-toggle {
  position: fixed;
  bottom: 80px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  border-radius: 20px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .product-list {
    .products-grid {
      &.list-mode .product-card {
        background: var(--van-background-3);
      }
    }

    .view-mode-toggle {
      background: var(--van-background-3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }
}

// 响应式设计
@media (max-width: 320px) {
  .products-grid {
    &.column-2 {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    &.column-3 {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
}

@media (max-width: 375px) {
  .products-grid {
    &.column-2 {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
  }
}

@media (min-width: 768px) {
  .products-grid {
    &.column-2 {
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    &.column-3 {
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
  }
}

@media (min-width: 1024px) {
  .products-grid {
    &.column-2 {
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    &.column-3 {
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
    }
  }
}

// 懒加载动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-card {
  animation: fadeIn 0.3s ease-out;
}

// 平滑滚动
.products-grid {
  scroll-behavior: smooth;
}
</style>