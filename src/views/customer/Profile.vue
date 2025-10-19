<template>
  <div class="profile-page">
    <!-- 用户信息头部 -->
    <div class="profile-header">
      <div class="user-info">
        <div class="user-avatar">
          <img
            :src="user.avatar || '/images/default-avatar.png'"
            :alt="user.nickname"
            @click="changeAvatar"
          />
          <van-icon
            v-if="user.isVerified"
            name="passed"
            class="verified-icon"
          />
        </div>
        <div class="user-details">
          <div class="username-row">
            <h3 class="nickname">{{ user.nickname }}</h3>
            <van-tag v-if="user.isVerified" type="success" size="small">
              已认证
            </van-tag>
          </div>
          <div class="user-meta">
            <span class="phone" v-if="user.phone">
              <van-icon name="phone-o" size="14" />
              {{ formatPhone(user.phone) }}
            </span>
            <span class="join-date">
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
      <van-button
        type="danger"
        block
        round
        @click="handleLogout"
        :loading="isLoggingOut"
      >
        退出登录
      </van-button>
    </div>

    <!-- 图片上传弹窗 -->
    <van-popup
      v-model:show="showAvatarPopup"
      position="bottom"
      round
      :style="{ height: '40%' }"
    >
      <div class="avatar-popup">
        <div class="popup-header">
          <h3>更换头像</h3>
          <van-icon name="cross" @click="showAvatarPopup = false" />
        </div>
        <div class="popup-content">
          <van-uploader
            :after-read="handleAvatarUpload"
            :max-size="5 * 1024 * 1024"
            :before-read="beforeAvatarUpload"
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
    <van-popup
      v-model:show="showVersionPopup"
      position="center"
      round
      :style="{ width: '80%' }"
    >
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
        <van-button
          type="primary"
          block
          round
          @click="showVersionPopup = false"
        >
          确定
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showImagePreview } from 'vant'
import { useAuthStore } from '../stores/auth'
import type { User } from '../types'

const router = useRouter()
const authStore = useAuthStore()

// 用户数据
const user = computed(() => authStore.user || {
  id: '1',
  nickname: '张三',
  phone: '13800138000',
  avatar: '/images/default-avatar.png',
  isVerified: true,
  createdAt: '2023-01-01'
})

// 用户统计数据
const userStats = ref({
  points: 1250,
  coupons: 3,
  favorites: 15
})

// 应用信息
const appVersion = ref('1.0.0')
const buildVersion = ref('20240101')
const updateTime = ref('2024-01-01')

// 弹窗状态
const showAvatarPopup = ref(false)
const showVersionPopup = ref(false)
const isLoggingOut = ref(false)

// 计算是否有未支付订单
const hasUnpaidOrders = ref(false)

// 格式化手机号
const formatPhone = (phone: string) => {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
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
    // 模拟上传过程
    showToast('上传中...')

    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 这里应该调用实际的API上传图片
    console.log('上传头像:', file)

    // 更新用户头像
    authStore.updateUser({ avatar: URL.createObjectURL(file) })

    showToast('头像更新成功')
    showAvatarPopup.value = false
  } catch (error) {
    showToast('上传失败，请重试')
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

    // 模拟退出登录过程
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 调用退出登录API
    await authStore.logout()

    showToast('退出成功')

    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    // 用户取消或操作失败
    if (error !== 'cancel') {
      showToast('退出失败，请重试')
    }
  } finally {
    isLoggingOut.value = false
  }
}

// 加载用户数据
const loadUserData = async () => {
  try {
    // 模拟API调用获取用户统计数据
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log('用户数据加载完成')
  } catch (error) {
    showToast('加载用户数据失败')
  }
}

// 初始化
onMounted(() => {
  loadUserData()
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background-color: var(--van-background);
  padding-bottom: 80px;
}

.profile-header {
  background: linear-gradient(135deg, var(--van-primary-color), var(--van-primary-color-dark));
  padding: 24px 16px;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;

  .user-avatar {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    border: 3px solid rgba(255, 255, 255, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .verified-icon {
      position: absolute;
      bottom: 4px;
      right: 4px;
      background: white;
      color: var(--van-success-color);
      border-radius: 50%;
      padding: 2px;
      font-size: 14px;
    }
  }

  .user-details {
    flex: 1;

    .username-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .nickname {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;

      span {
        font-size: 14px;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.user-stats {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--van-radius-lg);
  padding: 16px;

  .stat-item {
    text-align: center;

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 12px;
      opacity: 0.8;
    }
  }
}

.menu-section {
  margin: 16px 0;

  .van-cell-group {
    .van-cell {
      padding: 16px;

      .van-icon {
        margin-right: 8px;
        color: var(--van-primary-color);
      }
    }
  }
}

.logout-section {
  padding: 16px;
}

.version-text {
  color: var(--van-text-color-3);
  font-size: 14px;
}

.avatar-popup {
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--van-border-color);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .van-icon {
      cursor: pointer;
      font-size: 20px;
    }
  }

  .popup-content {
    padding: 16px;

    .upload-tips {
      margin-top: 16px;
      padding: 12px;
      background: var(--van-background-2);
      border-radius: var(--van-radius-md);

      p {
        font-size: 12px;
        color: var(--van-text-color-3);
        margin-bottom: 4px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.version-popup {
  .version-info {
    padding: 16px;

    h4 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--van-text-color);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        font-size: 14px;
        color: var(--van-text-color-2);
        margin-bottom: 8px;
        padding-left: 16px;
        position: relative;

        &:before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--van-primary-color);
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
    background-color: var(--van-background-3);
  }

  .profile-header {
    background: linear-gradient(135deg, var(--van-primary-color), var(--van-primary-color-dark));
  }

  .menu-section .van-cell-group {
    .van-cell {
      background: var(--van-background-3);
      border-color: var(--van-gray-6);

      .van-icon {
        color: var(--van-primary-color);
      }
    }
  }

  .version-popup .version-info {
    ul li {
      color: var(--van-text-color-2);
    }
  }
}

// 响应式设计
@media (max-width: 375px) {
  .profile-header {
    padding: 20px 16px;

    .user-info {
      gap: 12px;

      .user-avatar {
        width: 60px;
        height: 60px;
      }

      .user-details .username-row .nickname {
        font-size: 18px;
      }
    }

    .user-stats {
      padding: 12px;

      .stat-value {
        font-size: 18px;
      }

      .stat-label {
        font-size: 11px;
      }
    }
  }
}

@media (max-width: 320px) {
  .profile-header {
    padding: 16px;

    .user-info {
      gap: 8px;

      .user-avatar {
        width: 50px;
        height: 50px;
      }

      .user-details .username-row .nickname {
        font-size: 16px;
      }
    }

    .user-stats {
      .stat-value {
        font-size: 16px;
      }
    }
  }
}
</style>