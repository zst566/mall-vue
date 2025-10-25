<template>
  <div class="products-page">
    <!-- 搜索栏 -->
    <van-search
      v-model="searchQuery"
      placeholder="搜索商品"
      @input="onSearchInput"
      @search="onSearch"
      shape="round"
      background="transparent"
      class="search-bar"
    />

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item
          v-model="selectedCategory"
          :options="categoryOptions"
          @change="onCategoryChange"
        />
        <van-dropdown-item v-model="selectedSort" :options="sortOptions" @change="onSortChange" />
        <van-dropdown-item
          v-model="selectedPrice"
          :options="priceOptions"
          @change="onPriceChange"
        />
      </van-dropdown-menu>
    </div>

    <!-- 商品列表 -->
    <div class="products-container">
      <div v-if="loading" class="loading-container">
        <van-loading type="spinner" size="24px">加载中...</van-loading>
      </div>

      <div v-else-if="products.length === 0" class="empty-container">
        <van-empty description="暂无商品" />
      </div>

      <div v-else class="products-grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-card"
          @click="goToProductDetail(product.id)"
        >
          <div class="product-image">
            <PlaceholderImage width="100%" height="120px" />
            <div class="product-badge" v-if="product.isHot">热卖</div>
            <div class="product-badge sale" v-if="product.discount > 0">
              {{ product.discount }}折
            </div>
          </div>
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-price-row">
              <div class="product-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ product.price }}</span>
                <span class="price-unit">起</span>
              </div>
              <div
                class="product-original-price"
                v-if="product.originalPrice && product.originalPrice > product.price"
              >
                <span class="original-symbol">¥</span>
                <span class="original-value">{{ product.originalPrice }}</span>
              </div>
            </div>
            <div class="product-meta">
              <span class="sales-count">已售 {{ product.salesCount }}+</span>
              <span class="shop-name">{{ product.shopName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore && !loading" class="load-more">
        <van-loading type="spinner" size="20px">加载更多</van-loading>
      </div>
    </div>

    <!-- 返回顶部按钮 -->
    <van-back-top right="20px" bottom="80px" />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
  import type { Product } from '@/types'

  const router = useRouter()
  const route = useRoute()

  // 搜索相关
  const searchQuery = ref((route.query.keyword as string) || '')
  const onSearchInput = (value: string) => {
    searchQuery.value = value
  }

  const onSearch = () => {
    loadProducts(true)
  }

  // 筛选相关
  const selectedCategory = ref<string>('')
  const selectedSort = ref<string>('default')
  const selectedPrice = ref<string>('')

  const categoryOptions = [
    { text: '全部分类', value: '' },
    { text: '数码家电', value: '1' },
    { text: '服装鞋包', value: '2' },
    { text: '美妆护肤', value: '3' },
    { text: '食品生鲜', value: '4' },
    { text: '母婴用品', value: '5' },
    { text: '家居家装', value: '6' },
    { text: '运动户外', value: '7' },
    { text: '图书文具', value: '8' }
  ]

  const sortOptions = [
    { text: '综合排序', value: 'default' },
    { text: '价格从低到高', value: 'price_asc' },
    { text: '价格从高到低', value: 'price_desc' },
    { text: '销量优先', value: 'sales_desc' },
    { text: '最新上架', value: 'newest' }
  ]

  const priceOptions = [
    { text: '价格不限', value: '' },
    { text: '0-100元', value: '0-100' },
    { text: '100-500元', value: '100-500' },
    { text: '500-1000元', value: '500-1000' },
    { text: '1000元以上', value: '1000+' }
  ]

  // 商品数据
  const loading = ref(false)
  const products = ref<Product[]>([])
  const hasMore = ref(true)
  const page = ref(1)
  const pageSize = ref(10)

  // 模拟商品数据
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro 256GB',
      description: 'A17 Pro芯片，钛金属设计，专业级摄影系统',
      price: 8999,
      originalPrice: 9999,
      image: '/images/product1.jpg',
      images: ['/images/product1.jpg'],
      category: '手机数码',
      categoryId: '1',
      brand: 'Apple',
      stock: 100,
      sales: 1250,
      salesCount: 1250,
      rating: 4.8,
      isHot: true,
      isNew: true,
      discount: 9,
      shopName: '苹果官方旗舰店',
      tags: ['热卖', '新品'],
      status: 'active',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z'
    },
    {
      id: '2',
      name: '华为 Mate 60 Pro',
      description: '麒麟9000S芯片，卫星通信，超光变影像',
      price: 6999,
      originalPrice: 7999,
      image: '/images/product2.jpg',
      images: ['/images/product2.jpg'],
      category: '手机数码',
      categoryId: '1',
      brand: 'HUAWEI',
      stock: 80,
      sales: 890,
      salesCount: 890,
      rating: 4.7,
      isHot: false,
      isNew: false,
      discount: 0,
      shopName: '华为智能生活馆',
      tags: ['国产'],
      status: 'active',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z'
    },
    {
      id: '3',
      name: '小米14 Ultra',
      description: '徕卡光学镜头，骁龙8 Gen3，90W快充',
      price: 5999,
      originalPrice: 6999,
      image: '/images/product3.jpg',
      images: ['/images/product3.jpg'],
      category: '手机数码',
      categoryId: '1',
      brand: 'Xiaomi',
      stock: 150,
      sales: 2100,
      salesCount: 2100,
      rating: 4.6,
      isHot: true,
      isNew: false,
      discount: 8.5,
      shopName: '小米之家',
      tags: ['热卖', '性价比'],
      status: 'active',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'OPPO Find X6',
      description: '哈苏影像，天玑9200，100W超级闪充',
      price: 3999,
      originalPrice: 4999,
      image: '/images/product4.jpg',
      images: ['/images/product4.jpg'],
      category: '手机数码',
      categoryId: '1',
      brand: 'OPPO',
      stock: 120,
      sales: 650,
      salesCount: 650,
      rating: 4.5,
      isHot: false,
      isNew: false,
      discount: 8,
      shopName: 'OPPO体验店',
      tags: ['摄影'],
      status: 'active',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z'
    },
    {
      id: '5',
      name: 'vivo X100 Pro',
      description: '蔡司光学镜头，天玑9300，蓝海电池技术',
      price: 4699,
      originalPrice: 5499,
      image: '/images/product5.jpg',
      images: ['/images/product5.jpg'],
      category: '手机数码',
      categoryId: '1',
      brand: 'vivo',
      stock: 90,
      sales: 980,
      salesCount: 980,
      rating: 4.7,
      isHot: true,
      isNew: false,
      discount: 8.5,
      shopName: 'vivo线下店',
      tags: ['热卖', '摄影'],
      status: 'active',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z'
    },
    {
      id: '6',
      name: '三星 S24 Ultra',
      description: '骁龙8 Gen3，S Pen，2亿像素摄影',
      price: 9699,
      originalPrice: 10999,
      image: '/images/product6.jpg',
      images: ['/images/product6.jpg'],
      category: '手机数码',
      categoryId: '1',
      brand: 'Samsung',
      stock: 60,
      sales: 320,
      salesCount: 320,
      rating: 4.8,
      isHot: true,
      isNew: false,
      discount: 8.8,
      shopName: '三星电子',
      tags: ['热卖', '高端'],
      status: 'active',
      createdAt: '2024-10-01T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z'
    }
  ]

  // 筛选变化处理
  const onCategoryChange = (value: string) => {
    loadProducts(true)
  }

  const onSortChange = (value: string) => {
    selectedSort.value = value
    loadProducts(true)
  }

  const onPriceChange = (value: string) => {
    selectedPrice.value = value
    loadProducts(true)
  }

  // 加载商品
  const loadProducts = (reset = false) => {
    if (reset) {
      page.value = 1
      products.value = []
      hasMore.value = true
    }

    if (loading.value || !hasMore.value) return

    loading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    })

    // 模拟API请求延迟
    setTimeout(() => {
      let filteredProducts = [...mockProducts]

      // 搜索过滤
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filteredProducts = filteredProducts.filter(
          product =>
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query)
        )
      }

      // 分类过滤
      if (selectedCategory.value) {
        filteredProducts = filteredProducts.filter(
          product => product.categoryId === selectedCategory.value
        )
      }

      // 价格过滤
      if (selectedPrice.value) {
        const [min, max] = selectedPrice.value.split('-')
        filteredProducts = filteredProducts.filter(product => {
          if (max) {
            return product.price >= parseInt(min) && product.price <= parseInt(max)
          } else {
            return product.price >= parseInt(min)
          }
        })
      }

      // 排序
      switch (selectedSort.value) {
        case 'price_asc':
          filteredProducts.sort((a, b) => a.price - b.price)
          break
        case 'price_desc':
          filteredProducts.sort((a, b) => b.price - a.price)
          break
        case 'sales_desc':
          filteredProducts.sort((a, b) => b.salesCount - a.salesCount)
          break
        case 'newest':
          filteredProducts.sort((a, b) => parseInt(b.id) - parseInt(a.id))
          break
      }

      // 分页
      const startIndex = (page.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      const newProducts = filteredProducts.slice(startIndex, endIndex)

      products.value.push(...newProducts)
      hasMore.value = endIndex < filteredProducts.length

      loading.value = false
      closeToast()

      if (reset) {
        showToast('刷新成功')
      }
    }, 1000)
  }

  // 导航到商品详情
  const goToProductDetail = (productId: string) => {
    router.push({
      name: 'ProductDetail',
      params: { id: productId.toString() }
    })
  }

  // 滚动加载更多
  const onScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadProducts()
    }
  }

  // 初始化
  onMounted(() => {
    loadProducts()

    // 监听滚动事件
    window.addEventListener('scroll', onScroll)
  })
</script>

<style lang="scss" scoped>
  .products-page {
    min-height: 100vh;
    background-color: var(--van-background);
    padding-bottom: 80px;
  }

  .search-bar {
    padding: 12px 16px;
    background-color: transparent;
  }

  .filter-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--van-background);
    border-bottom: 1px solid var(--van-border-color);
  }

  .products-container {
    padding: 16px;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .product-card {
    background: var(--van-background-2);
    border-radius: var(--van-radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: all var(--van-transition-duration);

    &:active {
      transform: scale(0.98);
    }

    .product-image {
      position: relative;
      height: 180px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: var(--van-danger-color);
        color: white;
        padding: 2px 6px;
        border-radius: var(--van-radius-sm);
        font-size: 12px;
        font-weight: 500;

        &.sale {
          background: var(--van-warning-color);
        }
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
      }

      .product-desc {
        font-size: 12px;
        color: var(--van-text-color-3);
        margin-bottom: 8px;
        height: 32px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .product-price-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 8px;

        .product-price {
          display: flex;
          align-items: baseline;

          .price-symbol {
            color: var(--van-danger-color);
            font-size: 12px;
          }

          .price-value {
            color: var(--van-danger-color);
            font-size: 18px;
            font-weight: 600;
          }

          .price-unit {
            color: var(--van-text-color-3);
            font-size: 12px;
            margin-left: 2px;
          }
        }

        .product-original-price {
          display: flex;
          align-items: baseline;

          .original-symbol {
            color: var(--van-text-color-3);
            font-size: 12px;
            text-decoration: line-through;
          }

          .original-value {
            color: var(--van-text-color-3);
            font-size: 12px;
            text-decoration: line-through;
          }
        }
      }

      .product-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .sales-count {
          font-size: 11px;
          color: var(--van-text-color-3);
        }

        .shop-name {
          font-size: 11px;
          color: var(--van-primary-color);
        }
      }
    }
  }

  .load-more {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
    color: var(--van-text-color-3);
  }
</style>
