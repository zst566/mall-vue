<template>
  <div class="home-page">
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

  // 初始化
  onMounted(() => {
    // 加载首页数据
    console.log('初始化首页')

    // 检查微信登录状态（临时功能，正式环境删除）
    // TODO: 正式环境删除此功能
    if (authStore.isLoggedIn && authStore.user) {
      const userName = authStore.user.username || authStore.user.phone || '用户'
      showToast(`欢迎回来，${userName}！`)
    }
  })
</script>

<style lang="scss" scoped>
  .home-page {
    padding-bottom: 20px;
    background-color: #f7f8fa;
    min-height: 100%;
  }

  .search-bar {
    padding: 12px 16px;
    background-color: transparent;
  }

  .banner-section {
    height: 180px;
    margin: 0 16px 16px;
    border-radius: 8px;
    overflow: hidden;

    .banner-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .function-entries {
    margin: 0 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 16px 8px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .more {
      font-size: 14px;
      color: #666;
      cursor: pointer;

      &:hover {
        color: #1989fa;
      }
    }
  }

  .category-section {
    background: white;
    border-radius: 8px;
    margin: 0 16px 16px;
    padding: 16px;
  }

  .products-section {
    background: white;
    border-radius: 8px;
    margin: 0 16px 16px;
    padding: 16px;

    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .product-card {
      background: #f7f8fa;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .product-image {
        position: relative;
        height: 120px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ff976a;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
      }

      .product-info {
        padding: 8px;

        .product-name {
          font-size: 14px;
          color: #333;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-price {
          font-size: 16px;
          color: #ee0a24;
          font-weight: 600;
        }
      }
    }
  }

  .activity-section {
    background: white;
    border-radius: 8px;
    margin: 0 16px 16px;
    padding: 16px;

    .activity-list {
      .activity-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
          background: #f7f8fa;
        }

        .activity-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .activity-info {
          flex: 1;

          .activity-title {
            font-size: 14px;
            color: #333;
            margin-bottom: 4px;
          }

          .activity-desc {
            font-size: 12px;
            color: #666;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .home-page {
      background-color: #1a1a1a;
      color: #fff;
    }

    .section-header h3 {
      color: #fff;
    }

    .category-section,
    .products-section,
    .activity-section {
      background: #2a2a2a;
    }

    .product-card {
      background: #333;

      .product-name {
        color: #fff;
      }

      .product-price {
        color: #ff6b6b;
      }
    }

    .activity-card:hover {
      background: #3a3a3a;
    }

    .activity-title {
      color: #fff;
    }

    .activity-desc {
      color: #ccc;
    }
  }
</style>
