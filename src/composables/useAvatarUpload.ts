/**
 * 头像上传逻辑 Composable
 */
import { ref, type Ref } from 'vue'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'

export interface UseAvatarUploadReturn {
  showAvatarPopup: Ref<boolean>
  beforeAvatarUpload: (file: File) => boolean
  handleAvatarUpload: (file: File) => Promise<void>
  getDefaultAvatar: () => string
  handleImageError: (event: Event) => void
  changeAvatar: () => void
}

/**
 * 获取默认头像（使用 Base64 编码的 SVG）
 */
const getDefaultAvatar = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNlOGU4ZTgiLz4KPHBhdGggZD0iTTQwIDIwQzQ1LjUyMiAyMCA1MCAxOC41MjI4IDUwIDE2LjY2NjdDNTAgMTQuODExIDQ1LjUyMiAxMy4zMzMzIDQwIDEzLjMzMzNDMzQuNDc4IDEzLjMzMzMgMzAgMTQuODExIDMwIDE2LjY2NjdDMzAgMTguNTIyOCAzNC40NzggMjAgNDAgMjBaTTQwIDI2LjY2NjdDMjkuMDcyOSAyNi42NjY3IDIwLjMzMzMgMzAuMzMzMyAyMC4zMzMzIDM1TDIwLjMzMzMgMzguMzMzM0wyMC4zMzMzIDUwSDIwLjMzMzNDMjAuMzMzMyA1NS4wODg2IDI0Ljc0NTIgNTkuNSAzMCA1OS41SDM1QzM1LjU1MjMgNTkuNSAzNiA1OS4wNTIzIDM2IDU4LjVDMzYgNTcuOTQ3NyAzNS41NTIzIDU3LjUgMzUgNTcuNUgzMEMzMS45MzcxIDU3LjUgMjkuNTA4NiA1My41ODIzIDMwIDQ5LjY2NjdDMjkuMjkwMSA0Ni43MjE4IDMzLjYyNzMgNDIuODMzNCAzMy42MjczIDM4LjMzMzNDMzMuNjI3MyAzNi42NjY3IDMyIDE2LjY2NjcgMjAgMjAgQzI4IDIwIDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2N0MzMCAxNi42NjY3IDMwIDE2LjY2NjcgMzAgMTYuNjY2NyIgZmlsbD0iI2E0YTZhYSIvPgo8L3N2Zz4K'
}

export function useAvatarUpload(): UseAvatarUploadReturn {
  const authStore = useAuthStore()
  const showAvatarPopup = ref(false)

  // 更换头像
  const changeAvatar = () => {
    showAvatarPopup.value = true
  }

  // 上传前验证
  const beforeAvatarUpload = (file: File): boolean => {
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

  // 处理图片加载错误
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    if (img.src !== getDefaultAvatar()) {
      img.src = getDefaultAvatar()
    }
  }

  return {
    showAvatarPopup,
    beforeAvatarUpload,
    handleAvatarUpload,
    getDefaultAvatar,
    handleImageError,
    changeAvatar
  }
}



