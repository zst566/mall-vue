/**
 * 商户权限检查 Composable
 */
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { merchantOperatorService } from '@/services/merchantOperator'

export function useMerchantPermission() {
  const router = useRouter()

  /**
   * 检查商户操作员权限
   */
  const checkPermission = async (): Promise<boolean> => {
    try {
      const status = await merchantOperatorService.getMyStatus()
      if (!status.hasBinding || !status.merchantUser) {
        showToast('您尚未绑定商户，请先申请')
        router.push('/customer/merchant-binding')
        return false
      }
      if (status.merchantUser.approvalStatus !== 'APPROVED' || !status.merchantUser.isActive) {
        showToast('您的商户权限已被取消或未审核通过')
        router.push('/customer/merchant-binding')
        return false
      }
      return true
    } catch (error) {
      console.error('检查权限失败:', error)
      showToast('权限验证失败')
      return false
    }
  }

  return {
    checkPermission
  }
}







