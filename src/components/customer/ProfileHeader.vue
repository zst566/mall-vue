<template>
  <div class="profile-header">
    <div class="user-info">
      <div class="user-avatar" @click="$emit('avatar-click')">
        <img :src="avatarUrl" :alt="displayName" @error="handleImageError" />
        <van-icon v-if="user?.isVerified" name="passed" class="verified-icon" />
      </div>
      <div class="user-details">
        <div class="username-row">
          <h3 class="nickname">{{ displayName }}</h3>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/types'

interface Props {
  user: User | null
  isLoading?: boolean
  getDisplayName?: () => string
  getUserAvatar?: () => string
  formatPhone?: (phone: string | undefined) => string
  formatDate?: (dateStr: string | undefined) => string
  getDefaultAvatar?: () => string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

defineEmits<{
  'avatar-click': []
}>()

// 格式化手机号
const formatPhone = (phone: string | undefined): string => {
  if (props.formatPhone) {
    return props.formatPhone(phone)
  }
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 格式化日期
const formatDate = (dateStr: string | undefined): string => {
  if (props.formatDate) {
    return props.formatDate(dateStr)
  }
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  } catch (error) {
    console.error('日期格式化失败:', error)
    return ''
  }
}

// 获取默认头像
const getDefaultAvatar = (): string => {
  if (props.getDefaultAvatar) {
    return props.getDefaultAvatar()
  }
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNlOGU4ZTgiLz4KPHBhdGggZD0iTTQwIDIwQzQ1LjUyMiAyMCA1MCAxOC41MjI4IDUwIDE2LjY2NjdDNTAgMTQuODExIDQ1LjUyMiAxMy4zMzMzIDQwIDEzLjMzMzNDMzQuNDc4IDEzLjMzMzMgMzAgMTQuODExIDMwIDE2LjY2NjdDMzAgMTguNTIyOCAzNC40NzggMjAgNDAgMjBaTTQwIDI2LjY2NjdDMjkuMDcyOSAyNi42NjY3IDIwLjMzMzMgMzAuMzMzMyAyMC4zMzMzIDM1TDIwLjMzMzMgMzguMzMzM0wyMC4zMzMzIDUwSDIwLjMzMzNDMjAuMzMzMyA1NS4wODg2IDI0Ljc0NTIgNTkuNSAzMCA1OS41SDM1QzM1LjU1MjMgNTkuNSAzNiA1OS4wNTIzIDM2IDU4LjVDMzYgNTcuOTQ3NyAzNS41NTIzIDU3LjUgMzUgNTcuNUgzMEMzMS45MzcxIDU3LjUgMjkuNTA4NiA1My41ODIzIDMwIDQ5LjY2NjdDMjkuMjkwMSA0Ni43MjE4IDMzLjYyNzMgNDIuODMzNCAzMy42MjczIDM4LjMzMzNDMzMuNjI3MyAzNi42NjY3IDMyIDE2LjY2NjcgMjAgMjAgQzI4IDIwIDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2NyIgZmlsbD0iI2E0YTZhYSIvPgo8L3N2Zz4K'
}

// 获取显示名称
const displayName = computed(() => {
  if (props.getDisplayName) {
    return props.getDisplayName()
  }
  if (!props.user) {
    return '未登录用户'
  }
  if (
    props.user.nickname &&
    props.user.nickname !== 'null' &&
    props.user.nickname.trim() !== ''
  ) {
    return props.user.nickname
  }
  if (props.user.id && props.user.id.length >= 4) {
    return `WePark-${props.user.id.slice(-4)}`
  }
  return '未登录用户'
})

// 获取头像 URL
const avatarUrl = computed(() => {
  if (props.getUserAvatar) {
    return props.getUserAvatar()
  }
  if (!props.user?.avatar) return getDefaultAvatar()
  const avatarUrl = String(props.user.avatar)
  if (avatarUrl === 'null' || avatarUrl === '' || avatarUrl.trim() === '') {
    return getDefaultAvatar()
  }
  return props.user.avatar
})

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.src !== getDefaultAvatar()) {
    img.src = getDefaultAvatar()
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.profile-header {
  background: var(--theme-bg-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%));
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
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      padding: 3px;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(25, 137, 250, 0.3);
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
  }
}
</style>





