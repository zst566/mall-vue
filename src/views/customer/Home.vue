<template>
  <div class="home-page">
    <!-- 搜索栏 -->
    <div class="search-section">
      <van-search
        v-model="searchQuery"
        placeholder="🔍 搜索商品、品牌、店铺"
        @input="onSearchInput"
        @search="onSearch"
        shape="round"
        background="transparent"
        class="search-bar"
      />
    </div>

    <!-- Banner轮播 -->
    <div class="banner-section">
      <van-swipe :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="(item, index) in banners" :key="index">
          <PlaceholderImage width="100%" height="200px" />
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 功能入口 -->
    <div class="function-entries">
      <van-grid :column-num="4" :border="false">
        <van-grid-item icon="hot-o" text="热门商品" @click="goToProducts" />
        <van-grid-item icon="shop-o" text="店铺" @click="goToShops" />
        <van-grid-item icon="discount" text="促销活动" @click="goToPromotions" />
        <van-grid-item icon="service-o" text="客服" @click="contactService" />
      </van-grid>
    </div>

    <!-- 商品分类 -->
    <div class="category-section">
      <div class="section-header">
        <h3>商品分类</h3>
        <van-icon name="arrow" @click="goToCategories" />
      </div>
      <van-grid :column-num="4" :border="false">
        <van-grid-item
          v-for="(category, index) in categories"
          :key="index"
          :icon="category.icon"
          :text="category.name"
          @click="goToCategory(category.id)"
        />
      </van-grid>
    </div>

    <!-- 推荐商品 -->
    <div class="products-section">
      <div class="section-header">
        <h3>推荐商品</h3>
        <span class="more" @click="goToProducts">查看更多</span>
      </div>
      <div class="product-grid">
        <div
          v-for="product in featuredProducts"
          :key="product.id"
          class="product-card"
          @click="goToProductDetail(product.id)"
        >
          <div class="product-image">
            <PlaceholderImage width="100%" height="120px" />
            <div class="product-badge" v-if="product.isHot">热卖</div>
          </div>
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <div class="product-price">¥{{ product.price }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动专区 -->
    <div class="activity-section">
      <div class="section-header">
        <h3>活动专区</h3>
        <span class="more" @click="goToActivities">查看更多</span>
      </div>
      <div class="activity-list">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="activity-card"
          @click="goToActivity(activity.id)"
        >
          <div class="activity-image">
            <PlaceholderImage width="100%" height="100px" />
          </div>
          <div class="activity-info">
            <h4 class="activity-title">{{ activity.title }}</h4>
            <p class="activity-desc">{{ activity.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast } from 'vant'
  import { useAuthStore } from '@/stores/auth'
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'

  const router = useRouter()
  const authStore = useAuthStore()

  // 搜索查询
  const searchQuery = ref('')

  // Banner数据
  const banners = ref([
    {
      id: 1,
      title: '首页Banner1',
      image: '/images/banner1.jpg'
    },
    {
      id: 2,
      title: '首页Banner2',
      image: '/images/banner2.jpg'
    },
    {
      id: 3,
      title: '首页Banner3',
      image: '/images/banner3.jpg'
    }
  ])

  // 商品分类
  const categories = ref([
    { id: 1, name: '数码家电', icon: 'apps-o' },
    { id: 2, name: '服装鞋包', icon: 'shop-o' },
    { id: 3, name: '美妆护肤', icon: 'diamond-o' },
    { id: 4, name: '食品生鲜', icon: 'food-o' },
    { id: 5, name: '母婴用品', icon: 'gift-o' },
    { id: 6, name: '家居家装', icon: 'home-o' },
    { id: 7, name: '运动户外', icon: 'basketball-o' },
    { id: 8, name: '图书文具', icon: 'records-o' }
  ])

  // 推荐商品
  const featuredProducts = ref([
    {
      id: 1,
      name: 'iPhone 15 Pro',
      price: 8999,
      image: '/images/product1.jpg',
      isHot: true
    },
    {
      id: 2,
      name: '华为 Mate 60',
      price: 6999,
      image: '/images/product2.jpg',
      isHot: false
    },
    {
      id: 3,
      name: '小米手机',
      price: 2999,
      image: '/images/product3.jpg',
      isHot: true
    },
    {
      id: 4,
      name: 'OPPO 手机',
      price: 3999,
      image: '/images/product4.jpg',
      isHot: false
    }
  ])

  // 活动数据
  const activities = ref([
    {
      id: 1,
      title: '双十一大促',
      description: '全场商品5折起',
      image: '/images/activity1.jpg'
    },
    {
      id: 2,
      title: '新人专享',
      description: '新人首单立减50元',
      image: '/images/activity2.jpg'
    }
  ])

  // 搜索相关方法
  const onSearchInput = (value: string) => {
    // 处理搜索输入
    console.log('搜索输入:', value)
  }

  const onSearch = () => {
    if (searchQuery.value.trim()) {
      router.push({
        name: 'Products',
        query: { keyword: searchQuery.value.trim() }
      })
    }
  }

  // 导航相关方法
  const goToProducts = () => {
    router.push({ name: 'Products' })
  }

  const goToShops = () => {
    showToast('功能开发中...')
  }

  const goToPromotions = () => {
    router.push({ name: 'Promotions' })
  }

  const contactService = () => {
    showToast('联系客服中...')
  }

  const goToCategories = () => {
    router.push({ name: 'Categories' })
  }

  const goToCategory = (categoryId: number) => {
    router.push({
      name: 'Products',
      query: { category: categoryId.toString() }
    })
  }

  const goToProductDetail = (productId: number) => {
    router.push({
      name: 'ProductDetail',
      params: { id: productId.toString() }
    })
  }

  const goToActivities = () => {
    router.push({ name: 'Activities' })
  }

  const goToActivity = (activityId: number) => {
    router.push({
      name: 'ActivityDetail',
      params: { id: activityId.toString() }
    })
  }

  // 检查用户登录状态的函数
  const checkUserLoginStatus = () => {
    // 加载首页数据
    console.log('===== 用户登录状态检查 =====')

    // 检查认证状态 - 输出详细调试信息
    console.log('📱 认证状态检查:')
    console.log('  - isAuthenticated:', authStore.isAuthenticated)
    console.log('  - isLoggedIn:', authStore.isLoggedIn)
    console.log('  - isLoading:', authStore.isLoading)
    console.log('  - hasToken:', !!authStore.token)
    console.log('  - hasUser:', !!authStore.user)
    console.log('  - userRole:', authStore.userRole)

    // 检查localStorage中的token和user
    const storageToken = localStorage.getItem('token')
    const storageUser = localStorage.getItem('user')
    const storageRefreshToken = localStorage.getItem('refreshToken')

    console.log('💾 LocalStorage状态:')
    console.log('  - token存在:', !!storageToken)
    console.log('  - token长度:', storageToken ? storageToken.length : 0)
    console.log('  - user存在:', !!storageUser)
    console.log('  - refreshToken存在:', !!storageRefreshToken)

    // 如果token存在但user不存在，说明可能是首次加载
    if (storageToken && !storageUser) {
      console.warn('⚠️  Token存在但用户信息不存在，可能需要重新获取用户信息')
    }

    // 如果有用户信息，输出用户详情
    if (authStore.user) {
      console.log('👤 用户信息:')
      console.log('  - 用户ID:', authStore.user.id)
      console.log('  - 用户名:', authStore.user.username)
      console.log('  - 手机号:', authStore.user.phone)
      console.log('  - 角色:', authStore.user.role)
      console.log('  - 完整信息:', authStore.user)

      const userName = authStore.user.username || authStore.user.phone || '用户'
      showToast(`登录状态: 已登录，欢迎回来，${userName}！`)
      console.log('✅ 用户已登录，欢迎消息已显示')
    } else {
      console.log('⚠️  用户未登录')
      if (authStore.token) {
        console.warn('⚠️  存在token但用户信息为空，可能需要重新获取')
        showToast('登录状态: Token存在但用户信息为空')
      } else {
        showToast('登录状态: 未登录')
      }
    }

    console.log('===== 用户登录状态检查结束 =====')
  }

  // 初始化
  onMounted(() => {
    console.log('首页已加载')
  })
</script>

<style lang="scss" scoped>
  // 现代化色系定义
  $primary-color: #1989fa;
  $primary-gradient: linear-gradient(135deg, #1989fa 0%, #0a86ff 100%);
  $danger-color: #ee0a24;
  $warning-color: #ff976a;
  $success-color: #07c160;
  $text-primary: #1a1a1a;
  $text-secondary: #666;
  $bg-light: #f8f9fb;
  $bg-white: #ffffff;
  $shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  $shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
  $shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);

  .home-page {
    padding-bottom: 24px;
    background: linear-gradient(180deg, #f8f9fb 0%, #ffffff 100%);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  }

  // 搜索栏优化
  .search-section {
    padding: 12px 12px 8px;
    background: $bg-white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .search-bar {
      :deep(.van-search__input) {
        border-radius: 24px;
        background: linear-gradient(135deg, #f0f5ff 0%, #f5f7fc 100%);
        border: 2px solid transparent;
        transition: all 0.3s ease;
        font-size: 14px;
        color: $text-primary;

        &:focus {
          border-color: $primary-color;
          background: $bg-white;
          box-shadow: 0 0 0 3px rgba(25, 137, 250, 0.1);
        }
      }

      :deep(.van-search__action) {
        color: $primary-color;
        font-weight: 600;

        &:active {
          opacity: 0.8;
        }
      }
    }
  }

  // Banner优化
  .banner-section {
    height: 220px;
    margin: 16px 12px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: $shadow-md;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;

    :deep(.van-swipe__indicator) {
      background: rgba(255, 255, 255, 0.6);

      .van-swipe__indicator--active {
        background: rgba(255, 255, 255, 1);
      }
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%);
      pointer-events: none;
    }

    .banner-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  // 功能入口优化
  .function-entries {
    margin: 16px 12px;
    padding: 0;

    :deep(.van-grid) {
      gap: 12px;
    }

    :deep(.van-grid-item) {
      background: $bg-white;
      border-radius: 12px;
      box-shadow: $shadow-sm;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      padding: 12px 8px !important;
      cursor: pointer;

      &:active {
        transform: scale(0.95);
      }

      &:hover {
        box-shadow: $shadow-md;
        transform: translateY(-4px);
      }

      .van-grid-item__content {
        padding: 8px 0;
      }

      .van-grid-item__icon {
        font-size: 28px;
        color: $primary-color;
        margin-bottom: 8px;
      }

      .van-grid-item__text {
        font-size: 12px;
        color: $text-primary;
        font-weight: 500;
        margin-top: 4px;
      }
    }
  }

  // 分组标题优化
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 16px 12px;
    background: transparent;

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $text-primary;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .more {
      font-size: 13px;
      color: $primary-color;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;

      &::after {
        content: '→';
        font-size: 16px;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }

  // 分类部分优化
  .category-section {
    background: $bg-white;
    border-radius: 12px;
    margin: 8px 12px;
    padding: 0;
    box-shadow: $shadow-sm;
    overflow: hidden;

    :deep(.van-grid) {
      padding: 16px;
      gap: 8px;
    }

    :deep(.van-grid-item) {
      background: linear-gradient(135deg, #f5f7fc 0%, #f0f5ff 100%);
      border-radius: 10px;
      padding: 12px 8px !important;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        background: linear-gradient(135deg, #e8f0ff 0%, #e3ecff 100%);
        transform: scale(1.05);
      }

      .van-grid-item__icon {
        font-size: 24px;
        color: $primary-color;
      }

      .van-grid-item__text {
        font-size: 12px;
        color: $text-primary;
        font-weight: 500;
      }
    }
  }

  // 推荐商品部分优化
  .products-section {
    background: $bg-white;
    border-radius: 12px;
    margin: 8px 12px;
    padding: 16px;
    box-shadow: $shadow-sm;

    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 8px;
    }

    .product-card {
      background: $bg-white;
      border: 1px solid #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: $shadow-sm;

      &:hover {
        transform: translateY(-8px);
        box-shadow: $shadow-lg;
        border-color: $primary-color;

        .product-image {
          transform: scale(1.08);

          &::before {
            opacity: 1;
          }
        }
      }

      .product-image {
        position: relative;
        height: 140px;
        overflow: hidden;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(25, 137, 250, 0.2) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .product-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: linear-gradient(135deg, $danger-color 0%, #ff5047 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          z-index: 3;
          box-shadow: 0 2px 6px rgba(238, 10, 36, 0.3);
        }
      }

      .product-info {
        padding: 10px;

        .product-name {
          font-size: 13px;
          color: $text-primary;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        .product-price {
          font-size: 16px;
          color: $danger-color;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
      }
    }
  }

  // 活动专区优化
  .activity-section {
    background: $bg-white;
    border-radius: 12px;
    margin: 8px 12px;
    padding: 16px;
    box-shadow: $shadow-sm;

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }

    .activity-card {
      display: flex;
      align-items: stretch;
      gap: 12px;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, #f8f9fb 0%, #f5f7fc 100%);
      border: 1px solid #f0f0f0;
      overflow: hidden;

      &:hover {
        background: linear-gradient(135deg, #f0f5ff 0%, #e8f0ff 100%);
        transform: translateX(4px);
        box-shadow: $shadow-md;
        border-color: $primary-color;
      }

      .activity-image {
        width: 100px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        &:hover img {
          transform: scale(1.1);
        }

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, transparent 100%);
        }
      }

      .activity-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;

        .activity-title {
          font-size: 14px;
          color: $text-primary;
          margin-bottom: 4px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .activity-desc {
          font-size: 12px;
          color: $text-secondary;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .home-page {
      padding-bottom: 16px;
    }

    .banner-section {
      height: 180px;
      margin: 12px 8px;
    }

    .search-section {
      padding: 10px 8px 6px;
    }

    .section-header {
      padding: 16px 12px 8px;

      h3 {
        font-size: 16px;
      }
    }

    .products-section,
    .category-section,
    .activity-section {
      margin: 6px 8px;
      padding: 12px;
    }

    .product-grid {
      gap: 10px;
    }

    .product-card .product-image {
      height: 120px;
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    $bg-dark: #121212;
    $bg-dark-card: #1e1e1e;
    $text-dark: #e0e0e0;

    .home-page {
      background: linear-gradient(180deg, #1a1a1a 0%, #121212 100%);
      color: $text-dark;
    }

    .search-section {
      background: $bg-dark-card;
      border-bottom-color: rgba(255, 255, 255, 0.1);

      :deep(.van-search__input) {
        background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
        color: $text-dark;

        &:focus {
          border-color: #4a9eff;
          background: #2a2a2a;
        }
      }
    }

    .function-entries :deep(.van-grid-item) {
      background: $bg-dark-card;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

      .van-grid-item__text {
        color: $text-dark;
      }

      &:hover {
        box-shadow: 0 4px 16px rgba(25, 137, 250, 0.2);
      }
    }

    .category-section {
      background: $bg-dark-card;

      :deep(.van-grid-item) {
        background: linear-gradient(135deg, #2a2a2a 0%, #252525 100%);

        .van-grid-item__text {
          color: $text-dark;
        }

        &:hover {
          background: linear-gradient(135deg, #323232 0%, #2a2a2a 100%);
        }
      }
    }

    .products-section {
      background: $bg-dark-card;
      border-color: rgba(255, 255, 255, 0.1);

      .product-card {
        background: $bg-dark;
        border-color: rgba(255, 255, 255, 0.1);

        .product-name {
          color: $text-dark;
        }
      }
    }

    .activity-section {
      background: $bg-dark-card;

      .activity-card {
        background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%);
        border-color: rgba(255, 255, 255, 0.1);

        &:hover {
          background: linear-gradient(135deg, #323232 0%, #2a2a2a 100%);
          border-color: #4a9eff;
        }

        .activity-title {
          color: $text-dark;
        }

        .activity-desc {
          color: #999;
        }
      }
    }

    .section-header h3 {
      color: $text-dark;
    }

    .more {
      color: #4a9eff !important;
    }
  }
</style>
