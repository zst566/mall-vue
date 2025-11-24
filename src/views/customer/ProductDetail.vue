<template>
  <div class="product-detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      :title="product.name || '商品详情'"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      z-index="100"
      class="detail-nav-bar"
    />

    <!-- 商品图片轮播（只显示主图） -->
    <div class="image-carousel" v-if="mainImages.length > 0">
      <van-swipe :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="(image, index) in mainImages" :key="index">
          <img 
            :src="getImageUrlFromString(image)" 
            :alt="`商品主图 ${index + 1}`"
            class="carousel-image"
            @error="handleImageError"
          />
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
        <div class="original-price" v-if="product.originalPrice && product.price && product.originalPrice > product.price">
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
          <span class="promotion-text" v-if="productExtras.promotions && productExtras.promotions.length > 0">
            {{ productExtras.promotions[0] }}
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
          <div class="shop-name">{{ product.shopName || '商家名称' }}</div>
          <div class="shop-location" v-if="productExtras.shopLocation">
            <van-icon name="location-o" class="location-icon" />
            <span class="location-text">{{ productExtras.shopLocation }}</span>
          </div>
          <div class="shop-floor" v-if="productExtras.shopFloor">
            <van-icon name="shop-o" class="floor-icon" />
            <span class="floor-text">{{ productExtras.shopFloor }}</span>
          </div>
          <div class="shop-rating" v-if="productExtras.shopRating > 0">
            <van-rate :model-value="productExtras.shopRating" :size="14" readonly />
            <span class="rating-text">{{ productExtras.shopRating }}分</span>
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
        <div class="detail-text" v-if="productExtras.features && productExtras.features.length > 0">
          <h4>产品特点</h4>
          <p v-if="productExtras.features.length > 0">• {{ productExtras.features[0] }}</p>
          <p v-if="productExtras.features.length > 1">• {{ productExtras.features[1] }}</p>
          <p v-if="productExtras.features.length > 2">• {{ productExtras.features[2] }}</p>
        </div>
        <!-- 产品特点图片 -->
        <div class="feature-images" v-if="sortedProductImages && sortedProductImages.length > 0">
          <div 
            v-for="(image, index) in sortedProductImages" 
            :key="image.id || index"
            class="feature-image-item"
          >
            <img 
              :src="getImageUrl(image)" 
              :alt="`产品特点图片 ${index + 1}`"
              class="feature-image"
              @error="handleImageError"
              :loading="index === 0 ? 'eager' : 'lazy'"
            />
          </div>
        </div>
        <div class="detail-images" v-if="productExtras.detailImages && productExtras.detailImages.length > 0">
          <PlaceholderImage 
            v-for="(img, index) in productExtras.detailImages" 
            :key="index"
            width="100%" 
            height="200px" 
          />
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
        <div class="action-item" @click="goToHome">
          <van-icon name="home-o" />
          <span>首页</span>
        </div>
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
          <div class="spec-group" v-if="productExtras.specGroups && productExtras.specGroups.length > 0">
            <div class="spec-title">{{ productExtras.specGroups[0].name }}</div>
            <div class="spec-options">
              <div
                v-for="option in productExtras.specGroups[0].options"
                :key="option.value"
                :class="['spec-option', { selected: selectedSpec?.name === option.name }]"
                @click="selectSpec(option)"
              >
                {{ option.name }}
              </div>
            </div>
          </div>
          <div v-else class="no-specs">
            <p>暂无规格选项</p>
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
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
  import { productService } from '@/services/products'
  import type { Product } from '@/types'

  const router = useRouter()
  const route = useRoute()

  // 商品信息
  const productId = route.params.id as string
  const loading = ref(false)
  const product = reactive<Partial<Product>>({
    id: productId,
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    images: [],
    salesCount: 0,
    rating: 0,
    stock: 0,
    category: '',
    categoryId: '',
    shopName: '',
    tags: [],
    status: 'active',
    createdAt: '',
    updatedAt: ''
  })

  // 扩展字段（不在 Product 类型中）
  const productExtras = reactive({
    promotions: [] as string[],
    shopLogo: '',
    shopLocation: '',
    shopFloor: '',
    shopRating: 0,
    features: [] as string[],
    detailImages: [] as string[],
    specGroups: [] as any[]
  })

  // 产品图片列表（支持字符串数组和对象数组）
  const productImages = ref<Array<string | { url: string; position?: number; id?: string; isMain?: boolean }>>([])

  // 主图列表（用于顶部banner，只显示标记为主图的图片）
  const mainImages = computed(() => {
    if (!productImages.value || productImages.value.length === 0) {
      return []
    }
    
    // 从productImages中筛选出主图（isMain为true的图片）
    const mainImagesList = productImages.value.filter((img: any) => {
      if (typeof img === 'string') {
        return false // 字符串类型的图片不可能是主图
      }
      if (img && typeof img === 'object') {
        return img.isMain === true
      }
      return false
    })
    
    // 如果没有找到主图，返回空数组（不显示banner）
    return mainImagesList
  })

  // 按顺序排序的产品图片（显示所有图片，包括主图）
  const sortedProductImages = computed(() => {
    if (!productImages.value || productImages.value.length === 0) {
      return []
    }

    // 将图片转换为统一格式，显示所有图片（包括主图）
    const images = productImages.value.map((img, index) => {
      if (typeof img === 'string') {
        return {
          url: img,
          position: index,
          id: `img-${index}`
        }
      } else {
        return {
          url: img.url,
          position: img.position ?? index,
          id: img.id || `img-${index}`
        }
      }
    })

    // 按 position 排序（按图片设置的顺序排列）
    return images.sort((a, b) => a.position - b.position)
  })

  // 获取图片URL（从字符串）
  const getImageUrlFromString = (image: string | any): string => {
    if (typeof image === 'string') {
      return image
    }
    if (image && typeof image === 'object') {
      return image.url || image.src || ''
    }
    return ''
  }

  // 获取图片URL
  const getImageUrl = (image: { url: string; position?: number; id?: string }): string => {
    // 如果 URL 为空，直接返回占位图，避免触发 error 事件
    return image.url || '/placeholder-product.png'
  }

  // 图片加载错误处理
  const handleImageError = (event: Event) => {
    const target = event.target as HTMLImageElement
    if (target) {
      // 如果当前已经是占位图，或者占位图也加载失败，则不再处理，避免无限循环
      if (target.src.includes('placeholder-product.png')) {
        // 移除 error 事件监听器，防止重复触发
        target.onerror = null
        return
      }
      // 设置占位图，但只尝试一次
      target.src = '/placeholder-product.png'
      // 如果占位图也加载失败，移除监听器
      target.onerror = () => {
        target.onerror = null
      }
    }
  }

  // 规格选择
  const showSpecPopup = ref(false)
  const selectedSpec = ref<any>(null)
  const quantity = ref(1)

  // 收藏状态
  const isFavorite = ref(false)

  // 加载商品详情
  const loadProductDetail = async () => {
    loading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })

    try {
      const productData = await productService.getProductDetail(productId)
      
      // 更新商品基本信息
      Object.assign(product, {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        originalPrice: productData.originalPrice || 0,
        images: productData.images || [],
        salesCount: productData.salesCount || 0,
        rating: productData.rating || 0,
        stock: productData.stock || 0,
        category: productData.category || '',
        categoryId: productData.categoryId || '',
        shopName: (productData as any).shopName || (productData as any).merchant?.name || '',
        tags: productData.tags || [],
        status: productData.status || 'active',
        createdAt: productData.createdAt || '',
        updatedAt: productData.updatedAt || ''
      })

      // 处理商户信息（优先使用直接返回的字段，如果没有则从 merchant 对象中获取）
      const merchant = (productData as any).merchant
      product.shopName = (productData as any).shopName || merchant?.name || product.shopName || ''
      
      // 处理扩展字段（如果 API 返回了这些字段）
      if ((productData as any).promotions) {
        productExtras.promotions = (productData as any).promotions
      }
      
      // 商户信息：优先使用直接返回的字段，如果没有则从 merchant 对象中获取
      productExtras.shopLogo = (productData as any).shopLogo || merchant?.logo || ''
      productExtras.shopLocation = (productData as any).shopLocation || merchant?.address || ''
      productExtras.shopFloor = (productData as any).shopFloor || merchant?.floor || ''
      productExtras.shopRating = (productData as any).shopRating || (merchant?.rating ? Number(merchant.rating) : 0)
      if ((productData as any).features) {
        productExtras.features = (productData as any).features
      }
      if ((productData as any).detailImages) {
        productExtras.detailImages = (productData as any).detailImages
      }
      if ((productData as any).specGroups) {
        productExtras.specGroups = (productData as any).specGroups
      }

      // 如果没有图片，使用默认占位图
      if (!product.images || product.images.length === 0) {
        product.images = ['/placeholder-product.png']
      }

      // 加载产品图片（用于产品特点部分）
      // 后端现在返回图片对象数组（包括isMain等元数据），而不是字符串数组
      if (product.images && Array.isArray(product.images)) {
        productImages.value = product.images.map((img: any) => {
          // 如果已经是对象格式（后端返回的新格式），直接使用
          if (typeof img === 'object' && img !== null) {
            return {
              url: img.url || img.src || '',
              position: img.position ?? img.sortOrder ?? 0,
              id: img.id || img.key || '',
              isMain: img.isMain === true // 保留isMain标记
            }
          }
          // 如果是字符串（兼容旧格式），转换为对象格式
          if (typeof img === 'string') {
            return {
              url: img,
              position: 0,
              id: '',
              isMain: false
            }
          }
          return img
        })
      } else {
        productImages.value = []
      }
    } catch (error: any) {
      console.error('加载商品详情失败:', error)
      showToast(error.message || '加载商品详情失败，请稍后重试')
      
      // 加载失败时返回上一页
      setTimeout(() => {
        router.back()
      }, 1500)
    } finally {
      loading.value = false
      closeToast()
    }
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

  // 返回首页
  const goToHome = () => {
    router.push({ name: 'Home' })
  }

  // 返回上一页
  const onClickLeft = () => {
    router.back()
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
    const shopName = product.shopName || '商家'
    showToast(`正在跳转到${shopName}...`)
    // 这里可以跳转到商铺详情页
    // router.push({ name: 'ShopDetail', params: { shopId: product.merchantId } })
  }

  // 立即购买
  const buyNow = () => {
    // 如果商品有规格选项，需要先选择规格
    if (productExtras.specGroups && productExtras.specGroups.length > 0 && !selectedSpec.value) {
      showSpecPopup.value = true
      showToast('请先选择规格')
      return
    }

    const specName = selectedSpec.value ? selectedSpec.value.name : '默认规格'
    showConfirmDialog({
      title: '确认购买',
      message: `确认购买 ${specName} 规格的商品吗？`,
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
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .product-detail-page {
    min-height: 100vh;
    background: $glass-bg-gradient;
    background-attachment: fixed;
    background-size: cover;
    padding-bottom: 70px; /* 调整底部安全空间：60px(底部操作栏) + 10px(安全边距) */

    // 导航栏样式 - 透明背景与图片轮播融合
    :deep(.detail-nav-bar) {
      background: transparent;
      
      .van-nav-bar__content {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      
      .van-nav-bar__title {
        color: white;
        font-weight: 600;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
      
      .van-nav-bar__arrow {
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .image-carousel {
    width: 100%;
    background-color: #f5f5f5;

    .carousel-image {
      width: 100%;
      height: auto;
      min-height: 300px;
      max-height: 600px;
      object-fit: contain; // 使用 contain 确保图片完整显示，不被裁剪
      display: block;
      background-color: #f5f5f5;
    }
  }

  .product-info {
    padding: 16px;
    @include glassmorphism-card(base);
    margin: 16px;

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

        &.no-features {
          color: var(--van-text-color-3);
          font-style: italic;
        }
      }
    }

    .feature-images {
      margin-top: 16px;
      margin-bottom: 20px;

      .feature-image-item {
        margin-bottom: 0; // 图片上下间隔设置为0，紧密连接
        border-radius: 0; // 移除圆角，让图片紧密连接
        overflow: visible; // 改为 visible，不裁剪图片
        background-color: #f5f5f5;

        &:first-child {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        &:last-child {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          margin-bottom: 0;
        }

        .feature-image {
          width: 100%;
          height: auto; // 使用 auto 保持原始宽高比
          min-height: 200px;
          object-fit: contain; // 使用 contain 确保图片完整显示，不被裁剪
          display: block;
          transition: opacity 0.3s ease;

          &[loading="lazy"] {
            opacity: 0;
            animation: fadeIn 0.3s ease forwards;
          }

          @keyframes fadeIn {
            to {
              opacity: 1;
            }
          }
        }
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
    bottom: 0;
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
      gap: 12px;

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        min-width: 40px;

        .van-icon {
          font-size: 20px;
          color: var(--van-text-color-3);

          &.active {
            color: var(--van-warning-color);
          }
        }

        span {
          font-size: 11px;
          color: var(--van-text-color-3);
          margin-top: 2px;
          white-space: nowrap;
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

      .no-specs {
        padding: 20px;
        text-align: center;
        color: var(--van-text-color-3);
        font-size: 14px;
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
