<template>
  <div class="profile-page">
    <!-- 加载状态 -->
    <van-loading v-if="isLoading && !hasUser" type="spinner" vertical>加载中...</van-loading>

    <template v-else>
      <ProfileHeader
        :user="user"
        :is-loading="isLoading"
        :get-display-name="getDisplayName"
        :get-user-avatar="getUserAvatar"
        :format-phone="formatPhone"
        :format-date="formatDate"
        :get-default-avatar="avatarUpload.getDefaultAvatar"
        @avatar-click="avatarUpload.changeAvatar"
      />
      <ProfileStats :stats="userStats" />
      <ProfileMenu
        :has-unpaid-orders="hasUnpaidOrders"
        :merchant-status="merchantStatus"
        :merchant-status-text="merchantStatusText"
        :merchant-status-tag-type="merchantStatusTagType"
        :merchant-menu-title="merchantMenuTitle"
        :app-version="appVersion"
        @menu-click="handleMenuClick"
      />
      <div class="logout-section">
        <van-button type="danger" block round @click="logout.handleLogout" :loading="logout.isLoggingOut.value">
          退出登录
        </van-button>
      </div>
    </template>

    <AvatarUploadPopup
      v-model:show="avatarUpload.showAvatarPopup.value"
      :before-avatar-upload="avatarUpload.beforeAvatarUpload"
      :handle-avatar-upload="avatarUpload.handleAvatarUpload"
      @upload-success="handleAvatarUploadSuccess"
    />
    <VersionInfoPopup
      v-model:show="showVersionPopup"
      :app-version="appVersion"
      :build-version="buildVersion"
      :update-time="updateTime"
    />
    <LogoutConfirmDialog v-model:show="logout.showLogoutDialog.value" @confirm="logout.confirmLogout" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProfileData } from '@/composables/useProfileData'
import { useMerchantBinding } from '@/composables/useMerchantBinding'
import { useAvatarUpload } from '@/composables/useAvatarUpload'
import { useProfileNavigation } from '@/composables/useProfileNavigation'
import { useProfileLogout } from '@/composables/useProfileLogout'
import ProfileHeader from '@/components/customer/ProfileHeader.vue'
import ProfileStats from '@/components/customer/ProfileStats.vue'
import ProfileMenu from '@/components/customer/ProfileMenu.vue'
import AvatarUploadPopup from '@/components/customer/AvatarUploadPopup.vue'
import VersionInfoPopup from '@/components/customer/VersionInfoPopup.vue'
import LogoutConfirmDialog from '@/components/customer/LogoutConfirmDialog.vue'

// 使用 composables
const {
  user,
  hasUser,
  userStats,
  isLoading,
  loadUserData,
  getDisplayName,
  getUserAvatar,
  formatPhone,
  formatDate
} = useProfileData()

const {
  merchantMenuTitle,
  merchantStatus,
  merchantStatusText,
  merchantStatusTagType,
  goToMerchantManagement,
  refreshMerchantStatus
} = useMerchantBinding()

const avatarUpload = useAvatarUpload()

const navigation = useProfileNavigation()

const logout = useProfileLogout()

// 应用版本信息
const appVersion = ref('1.0.0')
const buildVersion = ref('20240101')
const updateTime = ref('2024-01-01')
const showVersionPopup = ref(false)

// 计算是否有未支付订单
const hasUnpaidOrders = computed(() => (userStats.value.unpaidOrders || 0) > 0)

// 处理菜单点击
const handleMenuClick = async (menuType: string) => {
  switch (menuType) {
    case 'account':
      navigation.goToAccount()
      break
    case 'orders':
      navigation.goToOrders()
      break
    case 'favorites':
      navigation.goToFavorites()
      break
    case 'addresses':
      navigation.goToAddresses()
      break
    case 'security':
      navigation.goToSecurity()
      break
    case 'notifications':
      navigation.goToNotifications()
      break
    case 'merchant':
      await goToMerchantManagement()
      break
    case 'service':
      navigation.contactService()
      break
    case 'help':
      navigation.goToHelp()
      break
    case 'about':
      navigation.goToAbout()
      break
    case 'version':
      showVersionPopup.value = true
      break
    default:
      console.warn('未知的菜单类型:', menuType)
  }
}

// 处理头像上传成功
const handleAvatarUploadSuccess = (avatarUrl: string) => {
  // 头像上传成功后，useAvatarUpload 已经更新了用户信息
  // 这里可以添加额外的处理逻辑
  console.log('头像上传成功:', avatarUrl)
}

// 初始化
onMounted(async () => {
  console.log('🚀 Profile 页面 onMounted 触发')
  console.log('👤 初始 authStore.user:', user.value)
  await loadUserData()
  // 加载商户绑定状态
  await refreshMerchantStatus()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.profile-page {
  min-height: 100vh;
  background: var(--theme-bg-gradient, $glass-bg-gradient);
  background-attachment: fixed;
  background-size: cover;
  padding-bottom: 80px;
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

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .profile-page {
    background-color: #1a1a1a;
  }
}

// 响应式设计
@media (max-width: 375px) {
  .logout-section {
    padding: 20px 12px;

    .van-button {
      height: 46px;
      font-size: 15px;
    }
  }
}

@media (max-width: 320px) {
  .logout-section {
    padding: 20px 12px;

    .van-button {
      height: 46px;
      font-size: 15px;
    }
  }
}
</style>
