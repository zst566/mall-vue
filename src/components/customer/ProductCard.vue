<template>
  <div class="product-card" :class="{ loading: isLoading }" @click="handleClick">
    <!-- 商品图片 -->
    <div class="product-image">
      <img
        :src="product.image || '/images/default-product.jpg'"
        :alt="product.name"
        class="product-image-main"
        @error="handleImageError"
        loading="lazy"
      />

      <!-- 标签 -->
      <div class="product-badges">
        <div v-if="product.isHot" class="badge hot">
          <van-icon name="fire-o" size="12" />
          热卖
        </div>
        <div v-if="product.discount > 0" class="badge discount">{{ product.discount }}折</div>
        <div v-if="product.isNew" class="badge new">新品</div>
        <div v-if="product.stock <= 10 && product.stock > 0" class="badge limited">
          剩余{{ product.stock }}件
        </div>
        <div v-if="product.stock <= 0" class="badge sold-out">已售罄</div>
      </div>

      <!-- 图片加载动画 -->
      <div v-if="isLoading" class="image-loading">
        <van-loading type="spinner" size="20px" />
      </div>
    </div>

    <!-- 商品信息 -->
    <div class="product-info">
      <h3 class="product-name" :title="product.name">
        {{ product.name }}
      </h3>

      <p v-if="product.description" class="product-desc">
        {{ product.description }}
      </p>

      <!-- 价格区域 -->
      <div class="price-section">
        <div class="current-price">
          <span class="currency">¥</span>
          <span class="price">{{ product.price }}</span>
          <span v-if="product.originalPrice && product.originalPrice > product.price" class="unit">
            起
          </span>
        </div>

        <div
          v-if="product.originalPrice && product.originalPrice > product.price"
          class="original-price"
        >
          <span class="currency-strike">¥</span>
          <span class="price-strike">{{ product.originalPrice }}</span>
        </div>
      </div>

      <!-- 购买按钮 -->
      <div class="action-section">
        <van-button
          v-if="product.stock <= 0"
          type="default"
          size="small"
          disabled
          class="buy-button disabled"
        >
          已售罄
        </van-button>
        <van-button
          v-else
          type="primary"
          size="small"
          @click.stop="handleBuyNow"
          :loading="isAddingToCart"
          class="buy-button"
        >
          {{ product.stock <= 0 ? '已售罄' : '立即购买' }}
        </van-button>
        <van-button
          v-if="product.stock > 0"
          type="warning"
          size="small"
          icon="cart-o"
          @click.stop="handleAddToCart"
          :loading="isAddingToCart"
          class="cart-button"
        />
      </div>

      <!-- 商品附加信息 -->
      <div class="product-meta">
        <div class="meta-item">
          <van-icon name="star-o" size="12" class="meta-icon" />
          <span class="meta-text">{{ product.rating || '4.8' }}分</span>
        </div>
        <div class="meta-item">
          <van-icon name="shop-o" size="12" class="meta-icon" />
          <span class="meta-text">{{ product.shopName || '自营' }}</span>
        </div>
        <div class="meta-item">
          <van-icon name="completed" size="12" class="meta-icon" />
          <span class="meta-text">{{ product.salesCount || 0 }}+人购买</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import type { Product } from '@/types'

  interface Props {
    product: Product
    showAddToCart?: boolean
  }

  interface Emits {
    (e: 'buy-now', product: Product): void
    (e: 'add-to-cart', product: Product): void
  }

  const props = withDefaults(defineProps<Props>(), {
    showAddToCart: true
  })

  const emit = defineEmits<Emits>()

  const router = useRouter()

  // 加载状态
  const isLoading = ref(false)
  const isAddingToCart = ref(false)

  // 格式化商品数据
  const formattedProduct = computed(() => ({
    ...props.product,
    price: Number(props.product.price) || 0,
    originalPrice: Number(props.product.originalPrice) || 0,
    stock: Number(props.product.stock) || 0,
    salesCount: Number(props.product.salesCount) || 0,
    rating: Number(props.product.rating) || 0,
    isHot: Boolean(props.product.isHot),
    isNew: Boolean(props.product.isNew),
    discount: Number(props.product.discount) || 0
  }))

  // 处理图片加载错误
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    img.src = '/images/default-product.jpg'
  }

  // 处理商品点击
  const handleClick = () => {
    if (formattedProduct.value.stock <= 0) return

    router.push({
      name: 'ProductDetail',
      params: { id: formattedProduct.value.id }
    })
  }

  // 处理立即购买
  const handleBuyNow = async () => {
    if (formattedProduct.value.stock <= 0) {
      showToast('商品已售罄')
      return
    }

    try {
      isAddingToCart.value = true
      showLoadingToast({
        message: '处理中...',
        forbidClick: true,
        duration: 0
      })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))

      emit('buy-now', formattedProduct.value)

      closeToast()
      showToast('已加入购物车')
    } catch (error) {
      closeToast()
      showToast('操作失败，请重试')
    } finally {
      isAddingToCart.value = false
    }
  }

  // 处理加入购物车
  const handleAddToCart = async () => {
    if (formattedProduct.value.stock <= 0) {
      showToast('商品已售罄')
      return
    }

    try {
      isAddingToCart.value = true
      showLoadingToast({
        message: '加入购物车中...',
        forbidClick: true,
        duration: 0
      })

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800))

      emit('add-to-cart', formattedProduct.value)

      closeToast()
      showToast('已加入购物车')
    } catch (error) {
      closeToast()
      showToast('加入购物车失败，请重试')
    } finally {
      isAddingToCart.value = false
    }
  }

  // 监听图片加载状态
  const checkImageLoad = () => {
    isLoading.value = true
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  }
</script>

<style lang="scss" scoped>
  .product-card {
    background: var(--van-background-2);
    border-radius: var(--van-radius-lg);
    overflow: hidden;
    transition: all var(--van-transition-duration);
    cursor: pointer;
    border: 1px solid var(--van-border-color);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-base);
    }

    &.loading {
      opacity: 0.7;
      pointer-events: none;
    }
  }

  .product-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1/1;
    background: var(--van-background);

    .product-image-main {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--van-transition-duration);
    }

    &:hover .product-image-main {
      transform: scale(1.05);
    }

    .product-badges {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 1;

      .badge {
        background: var(--van-danger-color);
        color: white;
        padding: 2px 6px;
        border-radius: var(--van-radius-sm);
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 2px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        &.hot {
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
        }

        &.discount {
          background: linear-gradient(135deg, #ff976a, #ff6b35);
        }

        &.new {
          background: linear-gradient(135deg, #1989fa, #07c160);
        }

        &.limited {
          background: linear-gradient(135deg, #ff976a, #ff7a45);
        }

        &.sold-out {
          background: linear-gradient(135deg, #969799, #c8c9cc);
        }
      }
    }

    .image-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      padding: 8px;
    }
  }

  .product-info {
    padding: 12px;

    .product-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--van-text-color);
      margin-bottom: 4px;
      line-height: 1.4;
      height: 40px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    }

    .product-desc {
      font-size: 12px;
      color: var(--van-text-color-3);
      margin-bottom: 8px;
      line-height: 1.4;
      height: 32px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    }

    .price-section {
      margin-bottom: 8px;

      .current-price {
        display: flex;
        align-items: baseline;
        gap: 2px;

        .currency {
          color: var(--van-danger-color);
          font-size: 12px;
          font-weight: 600;
        }

        .price {
          color: var(--van-danger-color);
          font-size: 16px;
          font-weight: 600;
        }

        .unit {
          color: var(--van-text-color-3);
          font-size: 11px;
          margin-left: 2px;
        }
      }

      .original-price {
        display: flex;
        align-items: baseline;
        gap: 2px;
        margin-top: 4px;
        text-decoration: line-through;

        .currency-strike {
          color: var(--van-text-color-3);
          font-size: 11px;
        }

        .price-strike {
          color: var(--van-text-color-3);
          font-size: 12px;
        }
      }
    }

    .action-section {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;

      .van-button {
        flex: 1;
        height: 32px;
        font-size: 12px;
        border-radius: var(--van-radius-md);

        &.disabled {
          background: var(--van-gray-4);
          color: var(--van-text-color-3);
          border-color: var(--van-gray-3);
        }

        &.cart-button {
          padding: 0;
          border: none;
          background: transparent;
          color: var(--van-primary-color);

          &:hover {
            background: var(--van-background-3);
          }
        }
      }
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid var(--van-border-color);

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .meta-icon {
          color: var(--van-text-color-3);
        }

        .meta-text {
          font-size: 11px;
          color: var(--van-text-color-3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60px;
        }
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .product-card {
      background: var(--van-background-3);
      border-color: var(--van-gray-6);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
    }

    .product-info {
      .product-name {
        color: var(--van-text-color);
      }

      .product-desc {
        color: var(--van-text-color-2);
      }

      .action-section .cart-button {
        &:hover {
          background: var(--van-background-2);
        }
      }

      .product-meta {
        border-top-color: var(--van-gray-6);

        .meta-icon {
          color: var(--van-text-color-2);
        }

        .meta-text {
          color: var(--van-text-color-2);
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 375px) {
    .product-info {
      padding: 10px;

      .product-name {
        font-size: 13px;
        height: 36px;
      }

      .product-desc {
        height: 28px;
      }

      .price-section .price {
        font-size: 15px;
      }

      .action-section {
        gap: 6px;

        .van-button {
          height: 30px;
          font-size: 11px;
        }
      }

      .product-meta {
        .meta-text {
          max-width: 50px;
          font-size: 10px;
        }
      }
    }
  }

  @media (min-width: 768px) {
    .product-card {
      .product-info {
        padding: 16px;

        .product-name {
          font-size: 15px;
          height: 48px;
        }

        .product-desc {
          height: 40px;
        }

        .price-section .price {
          font-size: 18px;
        }

        .action-section .van-button {
          height: 36px;
          font-size: 13px;
        }
      }
    }
  }
</style>
