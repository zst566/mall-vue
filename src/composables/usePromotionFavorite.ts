/**
 * 促销活动收藏管理 Composable
 */
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { favoriteService } from '@/services/favorites'
import { useAuthStore } from '@/stores/auth'

export interface UsePromotionFavoriteOptions {
  promotionId: string
}

export interface UsePromotionFavoriteReturn {
  isFavorite: Ref<boolean>
  favoriteLoading: Ref<boolean>
  toggleFavorite: () => Promise<void>
  initFavoriteStatus: () => Promise<void>
}

/**
 * 处理促销活动收藏功能
 */
export function usePromotionFavorite(
  promotionId: string
): UsePromotionFavoriteReturn {
  const router = useRouter()
  const authStore = useAuthStore()
  const isFavorite = ref(false)
  const favoriteLoading = ref(false)

  // 初始化收藏状态
  const initFavoriteStatus = async () => {
    if (!authStore.isAuthenticated) {
      isFavorite.value = false
      return
    }

    try {
      const result = await favoriteService.checkFavorite('PROMOTION', promotionId)
      isFavorite.value = result.isFavorite
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      // 失败时默认为未收藏，不影响用户体验
      isFavorite.value = false
    }
  }

  // 切换收藏
  const toggleFavorite = async () => {
    // 检查登录状态
    if (!authStore.isAuthenticated || !authStore.user) {
      showToast('请先登录')
      router.push({ name: 'Login' })
      return
    }

    // 防止重复点击
    if (favoriteLoading.value) {
      return
    }

    favoriteLoading.value = true
    try {
      if (isFavorite.value) {
        // 取消收藏
        await favoriteService.removeFavorite('PROMOTION', promotionId)
        isFavorite.value = false
        showToast('已取消收藏')
      } else {
        // 添加收藏
        await favoriteService.addFavorite('PROMOTION', promotionId)
        isFavorite.value = true
        showToast('已添加到收藏')
      }
    } catch (error: any) {
      console.error('收藏操作失败:', error)
      showToast(error.message || '操作失败，请稍后重试')
    } finally {
      favoriteLoading.value = false
    }
  }

  return {
    isFavorite,
    favoriteLoading,
    toggleFavorite,
    initFavoriteStatus,
  }
}
