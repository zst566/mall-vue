/**
 * 用户资料页面导航逻辑 Composable
 */
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

export interface UseProfileNavigationReturn {
  goToAccount: () => void
  goToOrders: () => void
  goToFavorites: () => void
  goToAddresses: () => void
  goToSecurity: () => void
  goToNotifications: () => void
  contactService: () => void
  goToHelp: () => void
  goToAbout: () => void
}

export function useProfileNavigation(): UseProfileNavigationReturn {
  const router = useRouter()

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

  return {
    goToAccount,
    goToOrders,
    goToFavorites,
    goToAddresses,
    goToSecurity,
    goToNotifications,
    contactService,
    goToHelp,
    goToAbout
  }
}




