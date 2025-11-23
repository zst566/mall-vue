<template>
  <div class="profile-page">
    <!-- 加载状态 -->
    <van-loading v-if="isLoading && !hasUser" type="spinner" vertical>加载中...</van-loading>

    <!-- 用户信息头部 -->
    <div v-else class="profile-header">
      <div class="user-info">
        <div class="user-avatar" @click="changeAvatar">
          <img :src="getUserAvatar()" :alt="getDisplayName()" @error="handleImageError" />
          <van-icon v-if="user?.isVerified" name="passed" class="verified-icon" />
        </div>
        <div class="user-details">
          <div class="username-row">
            <h3 class="nickname">{{ getDisplayName() }}</h3>
            <van-tag v-if="user?.isVerified" type="success" size="medium">已认证</van-tag>
          </div>
          <div class="user-meta">
            <span class="phone" v-if="user?.phone">
              <van-icon name="phone-o" size="14" />
              {{ formatPhone(user.phone) }}
            </span>
            <span class="join-date" v-if="user?.createdAt">
              <van-icon name="calendar-o" size="14" />
              加入于 {{ formatDate(user.createdAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 用户统计 -->
      <div class="user-stats">
        <div class="stat-item">
          <div class="stat-value">{{ userStats.points || 0 }}</div>
          <div class="stat-label">积分</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ userStats.coupons || 0 }}</div>
          <div class="stat-label">优惠券</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ userStats.favorites || 0 }}</div>
          <div class="stat-label">收藏</div>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <van-cell-group inset>
        <!-- 账户管理 -->
        <van-cell title="账户管理" is-link @click="goToAccount">
          <template #icon>
            <van-icon name="user-o" />
          </template>
        </van-cell>

        <!-- 我的订单 -->
        <van-cell title="我的订单" is-link @click="goToOrders">
          <template #icon>
            <van-icon name="orders-o" />
          </template>
          <template #right-icon>
            <van-badge :dot="hasUnpaidOrders">
              <van-icon name="arrow" />
            </van-badge>
          </template>
        </van-cell>

        <!-- 收藏管理 -->
        <van-cell title="收藏管理" is-link @click="goToFavorites">
          <template #icon>
            <van-icon name="star-o" />
          </template>
        </van-cell>

        <!-- 地址管理 -->
        <van-cell title="地址管理" is-link @click="goToAddresses">
          <template #icon>
            <van-icon name="location-o" />
          </template>
        </van-cell>

        <!-- 安全设置 -->
        <van-cell title="安全设置" is-link @click="goToSecurity">
          <template #icon>
            <van-icon name="lock" />
          </template>
        </van-cell>

        <!-- 通知设置 -->
        <van-cell title="通知设置" is-link @click="goToNotifications">
          <template #icon>
            <van-icon name="bell" />
          </template>
        </van-cell>

        <!-- 商户登录 -->
        <van-cell title="商户登录" is-link @click="goToMerchantLogin">
          <template #icon>
            <van-icon name="shop-o" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 其他功能 -->
    <div class="menu-section">
      <van-cell-group inset>
        <!-- 客服中心 -->
        <van-cell title="客服中心" is-link @click="contactService">
          <template #icon>
            <van-icon name="service-o" />
          </template>
        </van-cell>

        <!-- 帮助中心 -->
        <van-cell title="帮助中心" is-link @click="goToHelp">
          <template #icon>
            <van-icon name="question-o" />
          </template>
        </van-cell>

        <!-- 关于我们 -->
        <van-cell title="关于我们" is-link @click="goToAbout">
          <template #icon>
            <van-icon name="info-o" />
          </template>
        </van-cell>

        <!-- 版本信息 -->
        <van-cell title="版本信息" is-link @click="showVersionInfo">
          <template #icon>
            <van-icon name="version" />
          </template>
          <template #value>
            <span class="version-text">v{{ appVersion }}</span>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 退出登录按钮 -->
    <div class="logout-section">
      <van-button type="danger" block round @click="handleLogout" :loading="isLoggingOut">
        退出登录
      </van-button>
    </div>

    <!-- 图片上传弹窗 -->
    <van-popup v-model:show="showAvatarPopup" position="bottom" round :style="{ height: '40%' }">
      <div class="avatar-popup">
        <div class="popup-header">
          <h3>更换头像</h3>
          <van-icon name="cross" @click="showAvatarPopup = false" />
        </div>
        <div class="popup-content">
          <van-uploader
            :after-read="handleAvatarUpload as any"
            :max-size="5 * 1024 * 1024"
            :before-read="beforeAvatarUpload as any"
            preview-size="80"
            multiple
            :show-upload="false"
          />
          <div class="upload-tips">
            <p>支持 JPG、PNG 格式</p>
            <p>文件大小不超过 5MB</p>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 版本信息弹窗 -->
    <van-popup v-model:show="showVersionPopup" position="center" round :style="{ width: '80%' }">
      <div class="version-popup">
        <van-cell-group inset>
          <van-cell title="当前版本" :value="appVersion" />
          <van-cell title="更新时间" :value="updateTime" />
          <van-cell title="版本号" :value="buildVersion" />
        </van-cell-group>
        <div class="version-info">
          <h4>更新内容</h4>
          <ul>
            <li>优化用户界面体验</li>
            <li>修复已知问题</li>
            <li>提升系统性能</li>
            <li>新增多项功能</li>
          </ul>
        </div>
        <van-button type="primary" block round @click="showVersionPopup = false">确定</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showConfirmDialog, showImagePreview } from 'vant'
  import { useAuthStore } from '@/stores/auth'
  import { authService } from '@/services/auth'
  import type { User } from '@/types'

  const router = useRouter()
  const authStore = useAuthStore()

  // 用户数据
  const user = computed(() => authStore.user || null)

  // 判断是否有用户数据
  const hasUser = computed(() => !!authStore.user)

  // 用户统计数据
  const userStats = ref({
    points: 0,
    coupons: 0,
    favorites: 0,
    unpaidOrders: 0
  })

  // 加载状态
  const isLoading = ref(false)

  // 应用信息
  const appVersion = ref('1.0.0')
  const buildVersion = ref('20240101')
  const updateTime = ref('2024-01-01')

  // 弹窗状态
  const showAvatarPopup = ref(false)
  const showVersionPopup = ref(false)
  const isLoggingOut = ref(false)

  // 计算是否有未支付订单
  const hasUnpaidOrders = computed(() => (userStats.value.unpaidOrders || 0) > 0)

  // 获取用户显示名称
  const getDisplayName = () => {
    const currentUser = user.value

    if (!currentUser) {
      return '未登录用户'
    }

    // 优先使用 nickname
    if (
      currentUser.nickname &&
      currentUser.nickname !== 'null' &&
      currentUser.nickname.trim() !== ''
    ) {
      return currentUser.nickname
    }

    // 如果没有 nickname，使用 WePark- + 用户 ID 后四位
    if (currentUser.id && currentUser.id.length >= 4) {
      return `WePark-${currentUser.id.slice(-4)}`
    }

    return '未登录用户'
  }

  // 获取用户头像
  const getUserAvatar = () => {
    if (!user.value?.avatar) return getDefaultAvatar()
    // 确保头像 URL 不为 null 或 'null' 字符串
    const avatarUrl = String(user.value.avatar)
    if (avatarUrl === 'null' || avatarUrl === '' || avatarUrl.trim() === '') {
      return getDefaultAvatar()
    }
    return user.value.avatar
  }

  // 获取默认头像（使用 Base64 编码的 SVG）
  const getDefaultAvatar = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNlOGU4ZTgiLz4KPHBhdGggZD0iTTQwIDIwQzQ1LjUyMiAyMCA1MCAxOC41MjI4IDUwIDE2LjY2NjdDNTAgMTQuODExIDQ1LjUyMiAxMy4zMzMzIDQwIDEzLjMzMzNDMzQuNDc4IDEzLjMzMzMgMzAgMTQuODExIDMwIDE2LjY2NjdDMzAgMTguNTIyOCAzNC40NzggMjAgNDAgMjBaTTQwIDI2LjY2NjdDMjkuMDcyOSAyNi42NjY3IDIwLjMzMzMgMzAuMzMzMyAyMC4zMzMzIDM1TDIwLjMzMzMgMzguMzMzM0wyMC4zMzMzIDUwSDIwLjMzMzNDMjAuMzMzMyA1NS4wODg2IDI0Ljc0NTIgNTkuNSAzMCA1OS41SDM1QzM1LjU1MjMgNTkuNSAzNiA1OS4wNTIzIDM2IDU4LjVDMzYgNTcuOTQ3NyAzNS41NTIzIDU3LjUgMzUgNTcuNUgzMEMzMS45MzcxIDU3LjUgMjkuNTA4NiA1My41ODIzIDMwIDQ5LjY2NjdDMjkuMjkwMSA0Ni43MjE4IDMzLjYyNzMgNDIuODMzNCAzMy42MjczIDM4LjMzMzNDMzMuNjI3MyAzNi42NjY3IDMyIDE2LjY2NjcgMjAgMjAgQzI4IDIwIDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2NyIgZmlsbD0iI2E0YTZhYSIvPgo8L3N2Zz4K'
  }

  // 处理图片加载错误
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    if (img.src !== getDefaultAvatar()) {
      img.src = getDefaultAvatar()
    }
  }

  // 格式化手机号
  const formatPhone = (phone: string | undefined) => {
    if (!phone) return ''
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  // 格式化日期
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN')
    } catch (error) {
      console.error('日期格式化失败:', error)
      return ''
    }
  }

  // 更换头像
  const changeAvatar = () => {
    showAvatarPopup.value = true
  }

  // 上传前验证
  const beforeAvatarUpload = (file: File) => {
    const isValidType = ['image/jpeg', 'image/png'].includes(file.type)
    const isValidSize = file.size <= 5 * 1024 * 1024

    if (!isValidType) {
      showToast('请上传 JPG 或 PNG 格式的图片')
      return false
    }

    if (!isValidSize) {
      showToast('图片大小不能超过 5MB')
      return false
    }

    return true
  }

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      showToast({ type: 'loading', message: '上传中...', duration: 0 })

      // 调用真实API上传头像
      const result = await authService.updateAvatar(file)

      // 更新用户头像
      authStore.updateUser({ avatar: result.avatarUrl })

      showToast({ type: 'success', message: '头像更新成功' })
      showAvatarPopup.value = false
    } catch (error) {
      console.error('上传头像失败:', error)
      showToast({ type: 'fail', message: '上传失败，请重试' })
    }
  }

  // 跳转到账户管理
  const goToAccount = () => {
    router.push('/customer/account')
  }

  // 跳转到订单页面
  const goToOrders = () => {
    router.push('/customer/orders')
  }

  // 跳转到收藏管理
  const goToFavorites = () => {
    router.push('/customer/favorites')
  }

  // 跳转到地址管理
  const goToAddresses = () => {
    router.push('/customer/addresses')
  }

  // 跳转到安全设置
  const goToSecurity = () => {
    router.push('/customer/security')
  }

  // 跳转到通知设置
  const goToNotifications = () => {
    router.push('/customer/notifications')
  }

  // 跳转到商户登录
  const goToMerchantLogin = () => {
    showToast({ type: 'loading', message: '正在跳转...', duration: 1000 })
    setTimeout(() => {
      router.push('/merchant')
    }, 500)
  }

  // 联系客服
  const contactService = () => {
    showToast('正在跳转到客服聊天...')
    // 这里应该跳转到客服聊天页面或打开客服聊天窗口
  }

  // 跳转到帮助中心
  const goToHelp = () => {
    router.push('/customer/help')
  }

  // 跳转到关于我们
  const goToAbout = () => {
    router.push('/customer/about')
  }

  // 显示版本信息
  const showVersionInfo = () => {
    showVersionPopup.value = true
  }

  // 处理退出登录
  const handleLogout = async () => {
    try {
      await showConfirmDialog({
        title: '确认退出',
        message: '确定要退出登录吗？',
        confirmButtonText: '确定退出',
        cancelButtonText: '取消'
      })

      isLoggingOut.value = true

      // 调用退出登录API
      await authStore.logout()

      showToast({ type: 'success', message: '退出成功' })

      // 跳转到登录页
      router.push('/login')
    } catch (error) {
      // 用户取消或操作失败
      if (error !== 'cancel') {
        showToast({ type: 'fail', message: '退出失败，请重试' })
      }
    } finally {
      isLoggingOut.value = false
    }
  }

  // 加载用户数据
  const loadUserData = async () => {
    try {
      isLoading.value = true

      // 🔥 修复：容错处理 - 即使获取用户信息失败，也不清除 token
      // 可能是网络问题、服务器问题，或者用户信息暂时不可用
      try {
        const profileResult = await authService.getProfile()
        console.log('📡 Profile API 响应:', profileResult)
        console.log('👤 当前 authStore.user:', authStore.user)

        if (profileResult.success && profileResult.data) {
          console.log('📝 准备更新用户数据:', profileResult.data)
          authStore.updateUser(profileResult.data)
          console.log('✅ 用户详细信息已更新，新的 user:', authStore.user)
          console.log('🎯 User ID:', authStore.user?.id)
        } else {
          console.warn('⚠️ 获取用户信息失败，但保留已登录状态:', profileResult.message)
          // 不显示错误提示，因为用户可能已经有基本信息
        }
      } catch (profileError) {
        // 🔥 关键修复：获取用户信息失败不应该清除 token
        console.error('❌ 获取用户详细信息失败:', profileError)
        // 不抛出错误，不显示错误提示，保持已登录状态
        // 用户仍然可以使用已缓存的基本信息
      }

      // 获取用户统计数据（非关键操作，失败不影响）
      try {
        const statsResult = await authService.getUserStats()
        if (statsResult.success && statsResult.data) {
          userStats.value = {
            points: statsResult.data.points,
            coupons: statsResult.data.coupons,
            favorites: statsResult.data.favorites,
            unpaidOrders: statsResult.data.unpaidOrders || 0
          }
          console.log('✅ 用户统计数据已更新')
        }
      } catch (statsError) {
        console.warn('⚠️ 获取用户统计数据失败，使用默认值:', statsError)
        // 统计数据加载失败不影响页面展示
      }

      console.log('✅ 用户数据加载流程完成')
    } catch (error) {
      // 🔥 处理意外的错误
      console.error('❌ 加载用户数据时发生意外错误:', error)
      // 即使发生错误，也不清除 token，不强制跳转登录
    } finally {
      isLoading.value = false
    }
  }

  // 初始化
  onMounted(() => {
    console.log('🚀 Profile 页面 onMounted 触发')
    console.log('👤 初始 authStore.user:', authStore.user)
    console.log('📦 localStorage user:', localStorage.getItem('user'))
    loadUserData()
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .profile-page {
    min-height: 100vh;
    background: $glass-bg-gradient;
    background-attachment: fixed;
    background-size: cover;
    padding-bottom: 80px;
  }

  .profile-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    padding: 32px 20px 24px;
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      pointer-events: none;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    position: relative;
    z-index: 1;

    .user-avatar {
      position: relative;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      border: 4px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;

      &:active {
        transform: scale(0.95);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
      }

      .verified-icon {
        position: absolute;
        bottom: 2px;
        right: 2px;
        background: #07c160;
        color: white;
        border-radius: 50%;
        padding: 3px;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(7, 193, 96, 0.3);
      }
    }

    .user-details {
      flex: 1;

      .username-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;

        .nickname {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          letter-spacing: 0.3px;
        }
      }

      .user-meta {
        display: flex;
        flex-direction: column;
        gap: 6px;

        span {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;

          .van-icon {
            opacity: 0.9;
          }
        }
      }
    }
  }

  .user-stats {
    display: flex;
    justify-content: space-around;
    @include glassmorphism-card(base);
    padding: 20px 16px;
    position: relative;
    z-index: 1;

    .stat-item {
      text-align: center;
      flex: 1;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 6px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: #667eea;
      }

      .stat-label {
        font-size: 13px;
        color: #666666;
        font-weight: 500;
        letter-spacing: 0.2px;
      }
    }
  }

  .menu-section {
    margin: 16px 12px;

    .van-cell-group {
      @include glassmorphism-card(base);
      overflow: hidden;

      .van-cell {
        padding: 16px 18px;
        transition: background-color 0.2s ease;

        &:active {
          background-color: #f7f8fa;
        }

        .van-icon {
          margin-right: 12px;
          color: #667eea;
          font-size: 18px;
        }
      }
    }
  }

  .logout-section {
    padding: 24px 16px;

    .van-button {
      background: linear-gradient(135deg, #ee0a24 0%, #d90a1f 100%);
      border: none;
      font-weight: 600;
      font-size: 16px;
      height: 48px;
      box-shadow: 0 4px 12px rgba(238, 10, 36, 0.2);
      transition: all 0.3s ease;

      &:active {
        transform: translateY(1px);
        box-shadow: 0 2px 8px rgba(238, 10, 36, 0.15);
      }
    }
  }

  .version-text {
    color: #969799;
    font-size: 14px;
    font-weight: 500;
  }

  .avatar-popup {
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 18px;
      border-bottom: 1px solid #ebedf0;
      @include glassmorphism-card(light);

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #323233;
        letter-spacing: 0.3px;
      }

      .van-icon {
        cursor: pointer;
        font-size: 22px;
        color: #969799;
        transition: color 0.2s ease;

        &:hover {
          color: #323233;
        }
      }
    }

    .popup-content {
      padding: 24px 18px;

      .upload-tips {
        margin-top: 20px;
        padding: 14px 16px;
        background: linear-gradient(135deg, #f7f9fc 0%, #ecf0f5 100%);
        border-radius: 10px;
        border: 1px solid #e6e9ef;

        p {
          font-size: 13px;
          color: #646566;
          margin-bottom: 6px;
          font-weight: 500;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  .version-popup {
    .version-info {
      padding: 20px;

      h4 {
        font-size: 17px;
        font-weight: 700;
        margin-bottom: 16px;
        color: #323233;
        letter-spacing: 0.2px;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          font-size: 14px;
          color: #646566;
          margin-bottom: 10px;
          padding-left: 20px;
          position: relative;
          line-height: 1.6;

          &:before {
            content: '•';
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: 700;
            font-size: 16px;
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .profile-page {
      background-color: #1a1a1a;
    }

    .profile-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    }

    .user-stats {
      background: rgba(26, 26, 26, 0.95);
      backdrop-filter: blur(10px);

      .stat-label {
        color: #b0b0b0;
      }
    }

    .menu-section .van-cell-group {
      background: #242424;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);

      .van-cell {
        color: #e0e0e0;

        &:active {
          background-color: #2a2a2a;
        }
      }
    }

    .version-popup .version-info {
      h4 {
        color: #e0e0e0;
      }

      ul li {
        color: #b0b0b0;
      }
    }
  }

  // 响应式设计
  @media (max-width: 375px) {
    .profile-header {
      padding: 28px 16px 20px;

      .user-info {
        gap: 14px;

        .user-avatar {
          width: 72px;
          height: 72px;
          border-width: 3px;
        }

        .user-details {
          .username-row .nickname {
            font-size: 20px;
          }

          .user-meta span {
            font-size: 13px;
          }
        }
      }

      .user-stats {
        padding: 16px 12px;
        border-radius: 14px;

        .stat-value {
          font-size: 22px;
        }

        .stat-label {
          font-size: 12px;
        }
      }
    }

    .menu-section {
      margin: 12px 10px;

      .van-cell-group .van-cell {
        padding: 14px 16px;
      }
    }

    .logout-section {
      padding: 20px 12px;

      .van-button {
        height: 46px;
        font-size: 15px;
      }
    }
  }

  @media (max-width: 320px) {
    .profile-header {
      padding: 24px 14px 18px;

      .user-info {
        gap: 12px;
        margin-bottom: 20px;

        .user-avatar {
          width: 68px;
          height: 68px;
          border-width: 3px;
        }

        .user-details {
          .username-row .nickname {
            font-size: 18px;
          }

          .user-meta span {
            font-size: 12px;
          }
        }
      }

      .user-stats {
        padding: 14px 10px;
        border-radius: 12px;

        .stat-item {
          .stat-value {
            font-size: 20px;
          }

          .stat-label {
            font-size: 11px;
          }
        }
      }
    }

    .menu-section {
      margin: 10px 8px;

      .van-cell-group .van-cell {
        padding: 13px 14px;

        .van-icon {
          margin-right: 10px;
          font-size: 16px;
        }
      }
    }
  }
</style>
