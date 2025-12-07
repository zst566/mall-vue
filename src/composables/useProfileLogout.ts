/**
 * 用户退出登录逻辑 Composable
 */
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

export interface UseProfileLogoutReturn {
  isLoggingOut: Ref<boolean>
  showLogoutDialog: Ref<boolean>
  handleLogout: () => void
  confirmLogout: () => Promise<void>
}

export function useProfileLogout(): UseProfileLogoutReturn {
  const router = useRouter()
  const authStore = useAuthStore()

  const isLoggingOut = ref(false)
  const showLogoutDialog = ref(false)

  // 处理退出登录
  const handleLogout = () => {
    showLogoutDialog.value = true
  }

  const confirmLogout = async () => {
    try {
      showLogoutDialog.value = false
      isLoggingOut.value = true

      // 调用退出登录API
      await authStore.logout()

      showToast({ type: 'success', message: '退出成功' })

      // 跳转到登录页
      router.push('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      showToast({ type: 'fail', message: '退出失败，请重试' })
    } finally {
      isLoggingOut.value = false
    }
  }

  return {
    isLoggingOut,
    showLogoutDialog,
    handleLogout,
    confirmLogout
  }
}
