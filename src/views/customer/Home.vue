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

    <!-- 通讯测试按钮 -->
    <div class="communication-test">
      <van-button type="primary" block size="large" @click="testCommunication">
        🔗 测试小程序通讯（获取 mall_token）
      </van-button>
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
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showNotify } from 'vant'
  import { useAuthStore } from '@/stores/auth'
  import { miniprogramBridge } from '@/utils/miniprogramBridge'
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

  // 小程序消息监听器
  const messageListener = (event: CustomEvent) => {
    console.log('🔔 收到小程序消息:', event.detail)

    const detail = event.detail
    if (detail) {
      // 显示收到的消息内容
      showNotify({
        type: detail.success ? 'success' : 'warning',
        message: `📨 收到小程序消息:\n类型: ${detail.originalType || '未知'}\n状态: ${detail.success ? '成功' : '失败'}`,
        duration: 4000
      })

      // 如果有认证数据，特殊处理
      if (detail.originalType === 'auth' && detail.result?.data) {
        const authData = detail.result.data
        const token = authData.token
        if (token) {
          console.log('✅ 成功接收到 mall_token:', token)
          showNotify({
            type: 'success',
            message: `✅ 收到 mall_token: ${token.substring(0, 20)}...`,
            duration: 5000
          })
        }
      }

      // 如果是 getMallTokenResult
      if (detail.originalType === 'getMallToken' && detail.result?.data) {
        const resultData = detail.result.data
        const token = resultData.token || resultData.data?.token
        if (token) {
          console.log('✅ 成功接收到 mall_token:', token)
          showNotify({
            type: 'success',
            message: `✅ 收到 mall_token: ${token.substring(0, 20)}...`,
            duration: 5000
          })
        } else if (resultData.success) {
          showNotify({
            type: 'success',
            message: '✅ 通讯成功，但未包含token数据',
            duration: 3000
          })
        }
      }
    }
  }

  // 通讯测试函数
  const testCommunication = async () => {
    console.log('🔗 开始测试小程序通讯...')

    // 检测环境（放宽条件：允许微信浏览器和小程序环境）
    const isMiniProgram = miniprogramBridge.isMiniProgram()
    const isWechatBrowser = /micromessenger/.test(navigator.userAgent.toLowerCase())

    console.log('🔍 环境检测结果:')
    console.log('  - isMiniProgram():', isMiniProgram)
    console.log('  - isWechatBrowser:', isWechatBrowser)
    console.log('  - window.wx:', typeof window !== 'undefined' ? !!window.wx : 'undefined')
    console.log(
      '  - window.wx.miniProgram:',
      typeof window !== 'undefined' && window.wx ? !!window.wx.miniProgram : 'undefined'
    )

    if (!isMiniProgram && !isWechatBrowser) {
      console.warn('⚠️ 不在微信环境中，无法进行通讯测试')
      showNotify({
        type: 'warning',
        message: '⚠️ 需要在微信环境（浏览器或小程序）中测试',
        duration: 3000
      })
      return
    }

    // 根据环境提供不同的提示
    if (isMiniProgram) {
      console.log('✅ 检测到小程序环境，可以正常通讯')
    } else if (isWechatBrowser) {
      console.log('⚠️ 检测到微信浏览器环境，通讯功能可能受限')
      showNotify({
        type: 'primary',
        message: '📱 当前在微信浏览器中，建议在小程序webview中测试以获得完整体验',
        duration: 4000
      })
    }

    showToast({
      message: '正在获取 mall_token...',
      duration: 2000
    })

    try {
      // 请求小程序发送 mall_token
      const result = await miniprogramBridge.sendMessage('getMallToken', {})

      console.log('📤 通讯测试结果:', result)

      if (result.success) {
        const token = result.data?.token
        if (token) {
          console.log('✅ 成功获取 mall_token:', token)
          showNotify({
            type: 'success',
            message: `✅ 通讯成功！收到 mall_token: ${token.substring(0, 20)}...`,
            duration: 5000
          })
        } else {
          showNotify({
            type: 'success',
            message: '✅ 通讯成功（但未收到token数据）',
            duration: 3000
          })
        }
      } else {
        console.warn('⚠️ 通讯失败:', result.errMsg)
        showNotify({
          type: 'warning',
          message: `⚠️ 通讯失败: ${result.errMsg || '未知错误'}`,
          duration: 4000
        })
      }
    } catch (error) {
      console.error('❌ 通讯测试出错:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      showNotify({
        type: 'danger',
        message: `❌ 通讯测试失败: ${errorMsg}`,
        duration: 5000
      })
    }
  }

  // 初始化
  onMounted(() => {
    console.log('首页已加载')

    // 监听来自小程序的消息
    window.addEventListener('miniprogram-message', messageListener as EventListener)
    console.log('👂 已监听小程序消息')
  })

  // 清理
  onUnmounted(() => {
    window.removeEventListener('miniprogram-message', messageListener as EventListener)
    console.log('🧹 已清理小程序消息监听')
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

  .communication-test {
    margin: 16px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .communication-test :deep(.van-button) {
    font-size: 16px;
    height: 48px;
    font-weight: 600;
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
