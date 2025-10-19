<template>
  <div class="product-detail-page">
    <!-- 商品图片轮播 -->
    <div class="image-carousel">
      <van-swipe :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="(image, index) in product.images" :key="index">
          <PlaceholderImage width="100%" height="400px" />
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 商品基本信息 -->
    <div class="product-info">
      <div class="price-section">
        <div class="current-price">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ product.price }}</span>
          <span class="price-unit">起</span>
        </div>
        <div class="original-price" v-if="product.originalPrice > product.price">
          <span class="original-symbol">¥</span>
          <span class="original-value">{{ product.originalPrice }}</span>
          <span class="discount-text">省¥{{ product.originalPrice - product.price }}</span>
        </div>
      </div>

      <h2 class="product-name">{{ product.name }}</h2>
      <p class="product-desc">{{ product.description }}</p>

      <div class="product-meta">
        <div class="meta-item">
          <span class="meta-label">销量</span>
          <span class="meta-value">{{ product.salesCount }}+</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">评价</span>
          <span class="meta-value">{{ product.rating }}分</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">库存</span>
          <span class="meta-value">充足</span>
        </div>
      </div>
    </div>

    <!-- 优惠信息 -->
    <div class="promotion-section">
      <div class="section-header">
        <h3>优惠信息</h3>
      </div>
      <div class="promotion-list">
        <div class="promotion-item">
          <van-icon name="fire" class="promotion-icon" />
          <span class="promotion-text" v-if="product.promotions && product.promotions.length > 0">
            {{ product.promotions[0] }}
          </span>
        </div>
        <div class="promotion-item">
          <van-icon name="gift-o" class="promotion-icon" />
          <span class="promotion-text">新用户专享立减50元</span>
        </div>
      </div>
    </div>

    <!-- 规格选择 -->
    <div class="spec-section" @click="showSpecPopup = true">
      <div class="spec-item">
        <span class="spec-label">规格</span>
        <span class="spec-value">{{ selectedSpec?.name || '请选择规格' }}</span>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 商家信息 -->
    <div class="shop-section">
      <div class="section-header">
        <h3>商家信息</h3>
      </div>
      <div class="shop-info">
        <div class="shop-logo">
          <PlaceholderImage width="48px" height="48px" />
        </div>
        <div class="shop-details">
          <div class="shop-name">{{ product.shopName }}</div>
          <div class="shop-location">
            <van-icon name="location-o" class="location-icon" />
            <span class="location-text">{{ product.shopLocation }}</span>
          </div>
          <div class="shop-floor">
            <van-icon name="shop-o" class="floor-icon" />
            <span class="floor-text">{{ product.shopFloor }}</span>
          </div>
          <div class="shop-rating">
            <van-rate v-model="product.shopRating" :size="14" readonly />
            <span class="rating-text">{{ product.shopRating }}分</span>
          </div>
        </div>
        <van-button round size="small" icon="shop-o" @click="goToShop">进店</van-button>
      </div>
    </div>

    <!-- 商品详情 -->
    <div class="detail-section">
      <div class="section-header">
        <h3>商品详情</h3>
      </div>
      <div class="detail-content">
        <div class="detail-text">
          <h4>产品特点</h4>
          <p v-if="product.features && product.features.length > 0">• {{ product.features[0] }}</p>
          <p v-if="product.features && product.features.length > 1">• {{ product.features[1] }}</p>
          <p v-if="product.features && product.features.length > 2">• {{ product.features[2] }}</p>
        </div>
        <div class="detail-images">
          <PlaceholderImage width="100%" height="200px" />
          <PlaceholderImage width="100%" height="200px" />
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="usage-section">
      <div class="section-header">
        <h3>使用说明</h3>
      </div>
      <div class="usage-content">
        <div class="usage-item">
          <van-icon name="orders-o" class="usage-icon" />
          <span class="usage-text">购买后请在"我的订单"中查看核销码</span>
        </div>
        <div class="usage-item">
          <van-icon name="shop-o" class="usage-icon" />
          <span class="usage-text">到店消费时向商户出示核销码即可使用</span>
        </div>
        <div class="usage-item">
          <van-icon name="warning-o" class="usage-icon" />
          <span class="usage-text">每个核销码仅可使用一次，使用后自动失效</span>
        </div>
        <div class="usage-item">
          <van-icon name="clock-o" class="usage-icon" />
          <span class="usage-text">请在有效期内使用，过期自动作废</span>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <div class="left-buttons">
        <div class="action-item" @click="toggleFavorite">
          <van-icon :name="isFavorite ? 'star' : 'star-o'" :class="{ active: isFavorite }" />
          <span>收藏</span>
        </div>
        <div class="action-item" @click="contactShop">
          <van-icon name="service-o" />
          <span>客服</span>
        </div>
      </div>
      <div class="right-buttons">
        <van-button type="danger" size="large" @click="buyNow">立即购买</van-button>
      </div>
    </div>

    <!-- 规格选择弹窗 -->
    <van-popup v-model:show="showSpecPopup" position="bottom" round>
      <div class="spec-popup">
        <div class="popup-header">
          <h3>选择规格</h3>
          <van-icon name="cross" @click="showSpecPopup = false" />
        </div>
        <div class="popup-content">
          <div class="spec-group" v-if="product.specGroups && product.specGroups.length > 0">
            <div class="spec-title">{{ product.specGroups[0].name }}</div>
            <div class="spec-options">
              <div
                v-for="option in product.specGroups[0].options"
                :key="option.value"
                :class="['spec-option', { selected: selectedSpec?.name === option.name }]"
                @click="selectSpec(option)"
              >
                {{ option.name }}
              </div>
            </div>
          </div>
        </div>
        <div class="popup-footer">
          <div class="price-info">
            <span class="price">¥{{ selectedSpec.price || product.price }}</span>
            <span class="stock">库存{{ selectedSpec.stock || '充足' }}</span>
          </div>
          <div class="quantity-controls">
            <span class="label">数量</span>
            <van-stepper v-model="quantity" min="1" />
          </div>
          <van-button type="primary" block @click="confirmSpec">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showConfirmDialog } from 'vant'
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'

  const router = useRouter()
  const route = useRoute()

  // 商品信息
  const productId = parseInt(route.params.id as string)
  const product = reactive({
    id: productId,
    name: 'iPhone 15 Pro 256GB',
    description: 'A17 Pro芯片，钛金属设计，专业级摄影系统，支持5G网络，超视网膜XDR显示屏',
    price: 8999,
    originalPrice: 9999,
    images: [
      '/images/product1-1.jpg',
      '/images/product1-2.jpg',
      '/images/product1-3.jpg',
      '/images/product1-4.jpg'
    ],
    salesCount: 1250,
    rating: 4.8,
    promotions: ['限时促销，立减1000元', '满9999元送配件', '12期免息分期'],
    shopName: '苹果官方旗舰店',
    shopLogo: '/images/shop1.jpg',
    shopLocation: '滨江宏岸商场',
    shopFloor: 'L1层 A区',
    shopRating: 4.8,
    features: [
      'A17 Pro芯片，性能强劲',
      '4800万像素主摄，专业摄影',
      '钛金属机身，轻便坚固',
      'iOS 17系统，体验流畅'
    ],
    detailImages: ['/images/detail1.jpg', '/images/detail2.jpg'],
    specGroups: [
      {
        name: '存储容量',
        options: [
          { name: '128GB', value: '128', price: 7999, stock: '充足' },
          { name: '256GB', value: '256', price: 8999, stock: '充足' },
          { name: '512GB', value: '512', price: 10999, stock: '较少' },
          { name: '1TB', value: '1024', price: 12999, stock: '充足' }
        ]
      }
    ]
  })

  // 规格选择
  const showSpecPopup = ref(false)
  const selectedSpec = ref<any>(null)
  const quantity = ref(1)

  // 收藏状态
  const isFavorite = ref(false)

  // 模拟数据加载
  const loadProductDetail = () => {
    // 这里应该调用API获取商品详情
    console.log('加载商品详情:', productId)

    // 模拟加载延迟
    setTimeout(() => {
      showToast('商品信息加载完成')
    }, 500)
  }

  // 选择规格
  const selectSpec = (option: any) => {
    selectedSpec.value = option
  }

  // 确认规格选择
  const confirmSpec = () => {
    if (!selectedSpec.value) {
      showToast('请选择规格')
      return
    }

    showSpecPopup.value = false
    showToast(`已选择${selectedSpec.value.name}规格`)
  }

  // 切换收藏
  const toggleFavorite = () => {
    isFavorite.value = !isFavorite.value
    showToast(isFavorite.value ? '已添加到收藏' : '已取消收藏')
  }

  // 联系商家
  const contactShop = () => {
    showToast('正在跳转到客服聊天...')
  }

  // 进店
  const goToShop = () => {
    showToast(`正在跳转到${product.shopName}...`)
    // 这里可以跳转到商铺详情页
    // router.push({ name: 'ShopDetail', params: { shopId: product.shopId } })
  }

  // 立即购买
  const buyNow = () => {
    if (!selectedSpec.value) {
      showToast('请先选择规格')
      return
    }

    showConfirmDialog({
      title: '确认购买',
      message: `确认购买 ${selectedSpec.value.name} 规格的商品吗？`,
      confirmButtonText: '确认购买',
      cancelButtonText: '再想想'
    }).then(() => {
      showToast('正在跳转到支付页面...')
      setTimeout(() => {
        // 直接跳转到支付页面，无需购物车
        router.push({ name: 'Payment', params: { productId: productId.toString() } })
      }, 1000)
    })
  }

  // 初始化
  onMounted(() => {
    loadProductDetail()
  })
</script>

<style lang="scss" scoped>
  .product-detail-page {
    min-height: 100vh;
    background-color: var(--van-background);
    padding-bottom: 110px; /* 调整底部安全空间：50px(底部导航) + 60px(底部操作栏) */
  }

  .image-carousel {
    height: 400px;

    .carousel-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .product-info {
    padding: 16px;
    background-color: var(--van-background-2);

    .price-section {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;

      .current-price {
        display: flex;
        align-items: baseline;

        .price-symbol {
          color: var(--van-danger-color);
          font-size: 16px;
        }

        .price-value {
          color: var(--van-danger-color);
          font-size: 28px;
          font-weight: 600;
        }

        .price-unit {
          color: var(--van-text-color-3);
          font-size: 12px;
          margin-left: 4px;
        }
      }

      .original-price {
        display: flex;
        align-items: baseline;
        text-decoration: line-through;

        .original-symbol {
          color: var(--van-text-color-3);
          font-size: 12px;
        }

        .original-value {
          color: var(--van-text-color-3);
          font-size: 14px;
        }

        .discount-text {
          color: var(--van-warning-color);
          font-size: 12px;
          margin-left: 4px;
        }
      }
    }

    .product-name {
      font-size: 20px;
      font-weight: 600;
      color: var(--van-text-color);
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .product-desc {
      font-size: 14px;
      color: var(--van-text-color-2);
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .product-meta {
      display: flex;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--van-border-color);

      .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .meta-label {
          font-size: 12px;
          color: var(--van-text-color-3);
          margin-bottom: 4px;
        }

        .meta-value {
          font-size: 14px;
          color: var(--van-text-color);
          font-weight: 500;
        }
      }
    }
  }

  .promotion-section,
  .shop-section,
  .detail-section,
  .usage-section {
    background-color: var(--van-background-2);
    margin-top: 8px;

    .section-header {
      padding: 16px;
      border-bottom: 1px solid var(--van-border-color);

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);
        margin: 0;
      }
    }
  }

  .promotion-list {
    padding: 16px;

    .promotion-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .promotion-icon {
        color: var(--van-warning-color);
        font-size: 16px;
      }

      .promotion-text {
        font-size: 14px;
        color: var(--van-text-color);
      }
    }
  }

  .spec-section {
    background-color: var(--van-background-2);
    margin-top: 8px;

    .spec-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;

      .spec-label {
        font-size: 14px;
        color: var(--van-text-color);
      }

      .spec-value {
        font-size: 14px;
        color: var(--van-text-color-2);
      }

      .van-icon {
        color: var(--van-text-color-3);
      }
    }
  }

  .shop-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;

    .shop-logo {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .shop-details {
      flex: 1;

      .shop-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);
        margin-bottom: 6px;
      }

      .shop-location {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 4px;

        .location-icon {
          font-size: 14px;
          color: var(--van-primary-color);
        }

        .location-text {
          font-size: 13px;
          color: var(--van-text-color-2);
        }
      }

      .shop-floor {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 6px;

        .floor-icon {
          font-size: 14px;
          color: var(--van-warning-color);
        }

        .floor-text {
          font-size: 13px;
          color: var(--van-text-color-2);
          font-weight: 500;
        }
      }

      .shop-rating {
        display: flex;
        align-items: center;
        gap: 4px;

        .rating-text {
          font-size: 12px;
          color: var(--van-text-color-3);
        }
      }
    }
  }

  .detail-content {
    padding: 16px;

    .detail-text {
      margin-bottom: 20px;

      h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);
        margin-bottom: 8px;
      }

      p {
        font-size: 14px;
        color: var(--van-text-color-2);
        line-height: 1.6;
        margin-bottom: 4px;
      }
    }

    .detail-images {
      img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 12px;
      }

      img:last-child {
        margin-bottom: 0;
      }
    }
  }

  .usage-content {
    padding: 16px;

    .usage-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .usage-icon {
        font-size: 16px;
        color: var(--van-primary-color);
        margin-top: 2px;
        flex-shrink: 0;
      }

      .usage-text {
        font-size: 14px;
        color: var(--van-text-color);
        line-height: 1.5;
      }
    }
  }

  .bottom-bar {
    position: fixed;
    bottom: 50px; /* 调整位置，为底部导航栏留出空间 */
    left: 0;
    right: 0;
    height: 60px;
    background-color: white;
    border-top: 1px solid var(--van-border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 1000;

    .left-buttons {
      display: flex;
      gap: 16px;

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;

        .van-icon {
          font-size: 20px;
          color: var(--van-text-color-3);

          &.active {
            color: var(--van-warning-color);
          }
        }

        span {
          font-size: 12px;
          color: var(--van-text-color-3);
          margin-top: 2px;
        }
      }
    }

    .right-buttons {
      display: flex;
      gap: 8px;

      .van-button {
        flex: 1;
      }
    }
  }

  .spec-popup {
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--van-border-color);

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--van-text-color);
        margin: 0;
      }

      .van-icon {
        font-size: 20px;
        color: var(--van-text-color-3);
        cursor: pointer;
      }
    }

    .popup-content {
      padding: 16px;
      max-height: 300px;
      overflow-y: auto;

      .spec-group {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .spec-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--van-text-color);
          margin-bottom: 8px;
        }

        .spec-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .spec-option {
            padding: 8px 16px;
            border: 1px solid var(--van-border-color);
            border-radius: 20px;
            font-size: 14px;
            color: var(--van-text-color-2);
            background: white;
            cursor: pointer;
            transition: all 0.2s;

            &.selected {
              border-color: var(--van-primary-color);
              color: var(--van-primary-color);
              background: var(--van-background-2);
            }

            &:active {
              transform: scale(0.95);
            }
          }
        }
      }
    }

    .popup-footer {
      padding: 16px;
      border-top: 1px solid var(--van-border-color);

      .price-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .price {
          font-size: 16px;
          font-weight: 600;
          color: var(--van-danger-color);
        }

        .stock {
          font-size: 12px;
          color: var(--van-text-color-3);
        }
      }

      .quantity-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .label {
          font-size: 14px;
          color: var(--van-text-color);
        }
      }
    }
  }
</style>
