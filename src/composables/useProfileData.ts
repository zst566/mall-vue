/**
 * 用户资料数据管理 Composable
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'
import type { User } from '@/types'

export interface UserStats {
  points: number
  coupons: number
  favorites: number
  unpaidOrders: number
}

export interface UseProfileDataReturn {
  // 状态
  user: ComputedRef<User | null>
  hasUser: ComputedRef<boolean>
  userStats: Ref<UserStats>
  isLoading: Ref<boolean>
  
  // 方法
  loadUserData: () => Promise<void>
  getDisplayName: () => string
  getUserAvatar: () => string
  formatPhone: (phone: string | undefined) => string
  formatDate: (dateStr: string | undefined) => string
}

/**
 * 获取用户显示名称
 */
const getDisplayName = (user: User | null): string => {
  if (!user) {
    return '未登录用户'
  }

  // 优先使用 nickname
  if (
    user.nickname &&
    user.nickname !== 'null' &&
    user.nickname.trim() !== ''
  ) {
    return user.nickname
  }

  // 如果没有 nickname，使用 WePark- + 用户 ID 后四位
  if (user.id && user.id.length >= 4) {
    return `WePark-${user.id.slice(-4)}`
  }

  return '未登录用户'
}

/**
 * 获取默认头像（使用 Base64 编码的 SVG）
 */
const getDefaultAvatar = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNlOGU4ZTgiLz4KPHBhdGggZD0iTTQwIDIwQzQ1LjUyMiAyMCA1MCAxOC41MjI4IDUwIDE2LjY2NjdDNTAgMTQuODExIDQ1LjUyMiAxMy4zMzMzIDQwIDEzLjMzMzNDMzQuNDc4IDEzLjMzMzMgMzAgMTQuODExIDMwIDE2LjY2NjdDMzAgMTguNTIyOCAzNC40NzggMjAgNDAgMjBaTTQwIDI2LjY2NjdDMjkuMDcyOSAyNi42NjY3IDIwLjMzMzMgMzAuMzMzMyAyMC4zMzMzIDM1TDIwLjMzMzMgMzguMzMzM0wyMC4zMzMzIDUwSDIwLjMzMzNDMjAuMzMzMyA1NS4wODg2IDI0Ljc0NTIgNTkuNSAzMCA1OS41SDM1QzM1LjU1MjMgNTkuNSAzNiA1OS4wNTIzIDM2IDU4LjVDMzYgNTcuOTQ3NyAzNS41NTIzIDU3LjUgMzUgNTcuNUgzMEMzMS45MzcxIDU3LjUgMjkuNTA4NiA1My41ODIzIDMwIDQ5LjY2NjdDMjkuMjkwMSA0Ni43MjE4IDMzLjYyNzMgNDIuODMzNCAzMy42MjczIDM4LjMzMzNDMzMuNjI3MyAzNi42NjY3IDMyIDE2LjY2NjcgMjAgMjAgQzI4IDIwIDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2NyIgZmlsbD0iI2E0YTZhYSIvPgo8L3N2Zz4K'
}

/**
 * 格式化手机号
 */
const formatPhone = (phone: string | undefined): string => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 格式化日期
 */
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  } catch (error) {
    console.error('日期格式化失败:', error)
    return ''
  }
}

export function useProfileData(): UseProfileDataReturn {
  const authStore = useAuthStore()

  // 用户数据
  const user = computed(() => authStore.user || null)

  // 判断是否有用户数据
  const hasUser = computed(() => !!authStore.user)

  // 用户统计数据
  const userStats = ref<UserStats>({
    points: 0,
    coupons: 0,
    favorites: 0,
    unpaidOrders: 0
  })

  // 加载状态
  const isLoading = ref(false)

  // 获取用户显示名称
  const getDisplayNameWrapper = (): string => {
    return getDisplayName(user.value)
  }

  // 获取用户头像
  const getUserAvatar = (): string => {
    if (!user.value?.avatar) return getDefaultAvatar()
    // 确保头像 URL 不为 null 或 'null' 字符串
    const avatarUrl = String(user.value.avatar)
    if (avatarUrl === 'null' || avatarUrl === '' || avatarUrl.trim() === '') {
      return getDefaultAvatar()
    }
    return user.value.avatar
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

  return {
    user,
    hasUser,
    userStats,
    isLoading,
    loadUserData,
    getDisplayName: getDisplayNameWrapper,
    getUserAvatar,
    formatPhone,
    formatDate
  }
}





