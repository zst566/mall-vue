<template>
  <div class="home-page">
    <!-- 顶部欢迎横幅（橙色渐变） -->
    <section class="hero-section">
      <div class="hero-title">欢迎来到黄金海岸</div>
      <div class="hero-subtitle">精选优惠 · 积分好礼</div>
    </section>

    <!-- 四功能入口 -->
    <QuickNav :items="quickNavItems" @click="handleQuickNavClick" />

    <!-- 热门促销列表 -->
    <HotPromotions
      @view-all="goToPromotions"
      @item-click="goToProductDetail"
    />
  </div>
  </template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast } from 'vant'
  import { useAuthStore } from '@/stores/auth'
  import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
  import HotPromotions from '@/components/customer/HotPromotions.vue'
  import QuickNav, { type QuickNavItem } from '@/components/customer/QuickNav.vue'

  const router = useRouter()
  const authStore = useAuthStore()

  // 热门促销数据改为在 HotPromotions 组件内从后端获取

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

  const goToPoints = () => showToast('积分兑换 敬请期待')
  const goToVip = () => showToast('会员专享 敬请期待')
  const goToHot = () => goToPromotions()

  // 快速导航项配置
  const quickNavItems = ref<QuickNavItem[]>([
    { icon: 'gift-o', text: '积分兑换', action: goToPoints },
    { icon: 'discount', text: '限时优惠', action: goToPromotions },
    { icon: 'star-o', text: '会员专享', action: goToVip },
    // 修正图标名称：Vant 4 无 `trending-up-o`，使用 `fire-o` 表示热门
    { icon: 'fire-o', text: '热门推荐', action: goToHot }
  ])

  const handleQuickNavClick = (item: QuickNavItem) => {
    // 点击事件已通过 action 处理，这里可以添加额外逻辑
  }

  const goToProductDetail = (data: { promotionId: number; productId?: string | number }) => {
    // 优先跳转到促销详情页面
    if (data.promotionId) {
      router.push({
        name: 'PromotionDetail',
        params: { id: data.promotionId.toString() }
      })
    } else if (data.productId) {
      // 如果没有促销ID，则跳转到商品详情页面
      router.push({
        name: 'ProductDetail',
        params: { id: data.productId.toString() }
      })
    }
  }

  // 其余保留的导航见详情页

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
  @use '@/styles/variables.scss' as *;
  // 现代化色系定义
  $primary-color: $primary;
  $primary-gradient: linear-gradient(135deg, #1989fa 0%, #0a86ff 100%);
  $danger-color: $danger;
  $warning-color: $warning;
  $success-color: $success;
  $text-primary: $text-color-primary;
  $text-secondary: $text-color-tertiary;
  $bg-light: #f8f9fb;
  $bg-white: $bg-color-secondary;
  $shadow-sm: $shadow-sm;
  $shadow-md: $shadow-base;
  $shadow-lg: $shadow-lg;

  .home-page {
    padding-bottom: 24px;
    background: linear-gradient(180deg, #f8f9fb 0%, #ffffff 100%);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  }

  // 顶部欢迎横幅
  .hero-section {
    margin: 12px 12px 8px;
    padding: 28px 18px;
    border-radius: 16px;
    background: linear-gradient(180deg, #ff9d2f 0%, #ff7f00 100%);
    color: #fff;
    box-shadow: $shadow-md;

    .hero-title {
      font-size: $font-size-xxl;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .hero-subtitle {
      margin-top: 8px;
      font-size: $font-size-base;
      opacity: 0.95;
    }
  }


  // 分组标题与促销列表样式已迁移至 HotPromotions 组件

  // 旧的活动/分类/商品区块已由促销列表替换

  // 响应式设计
  @media (max-width: 768px) {
    .home-page {
      padding-bottom: 16px;
    }

    .hero-section { margin: 12px 8px 6px; padding: 24px 16px; }

    .search-section {
      padding: 10px 8px 6px;
    }


    // 响应式样式由 HotPromotions 组件内处理
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

    // 暗色样式由 HotPromotions 组件内处理
  }
</style>
