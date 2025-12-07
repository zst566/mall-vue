/**
 * 商户绑定状态管理 Composable
 */
import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { merchantOperatorService, type MerchantOperatorStatus } from '@/services/merchantOperator'
import { useAppStore } from '@/stores/app'

export interface UseMerchantBindingReturn {
  merchantBindingStatus: Ref<MerchantOperatorStatus | null>
  merchantMenuTitle: ComputedRef<string>
  merchantStatus: ComputedRef<string | null>
  merchantStatusText: ComputedRef<string>
  merchantStatusTagType: ComputedRef<string>
  goToMerchantManagement: () => Promise<void>
  refreshMerchantStatus: () => Promise<void>
}

export function useMerchantBinding(): UseMerchantBindingReturn {
  const router = useRouter()
  const merchantBindingStatus = ref<MerchantOperatorStatus | null>(null)

  // 防止循环跳转的标记
  const isNavigatingToMerchant = ref(false)

  // 商户菜单标题
  const merchantMenuTitle = computed(() => {
    if (!merchantBindingStatus.value) return '商户管理'
    if (!merchantBindingStatus.value.hasBinding) return '申请绑定商户操作员'
    
    // 如果已绑定且审核通过，显示商户编号
    const merchantUser = merchantBindingStatus.value.merchantUser
    if (merchantUser?.approvalStatus === 'APPROVED' && merchantUser?.merchantCode) {
      return `商户管理 (${merchantUser.merchantCode})`
    }
    
    return '商户管理'
  })

  // 商户状态
  const merchantStatus = computed(() => {
    if (!merchantBindingStatus.value?.hasBinding) return null
    const merchantUser = merchantBindingStatus.value.merchantUser
    // 🔥 优化：如果权限被取消（isActive 为 false 或 approvalStatus 不是 APPROVED），返回 null 使入口显示为申请状态
    if (!merchantUser?.isActive || merchantUser?.approvalStatus !== 'APPROVED') {
      return null
    }
    return merchantUser.approvalStatus
  })

  // 商户状态文本
  const merchantStatusText = computed(() => {
    const status = merchantStatus.value
    if (!status) return ''
    const statusMap = {
      PENDING: '审核中',
      APPROVED: '已通过',
      REJECTED: '已拒绝'
    }
    return statusMap[status] || ''
  })

  // 商户状态标签类型
  const merchantStatusTagType = computed(() => {
    const status = merchantStatus.value
    if (status === 'APPROVED') return 'success'
    if (status === 'REJECTED') return 'danger'
    return 'warning'
  })

  // 刷新商户绑定状态
  const refreshMerchantStatus = async () => {
    try {
      const statusResult = await merchantOperatorService.getMyStatus()
      console.log('✅ 商户绑定状态已更新:', JSON.stringify(statusResult, null, 2))
      
      // 🔥 优化：如果用户已被商户取消权限，将入口重置为申请状态
      if (statusResult.hasBinding && statusResult.merchantUser) {
        const merchantUser = statusResult.merchantUser
        // 检查是否被取消权限：审核状态不是 APPROVED 或 isActive 为 false
        if (merchantUser.approvalStatus !== 'APPROVED' || !merchantUser.isActive) {
          console.warn('⚠️ 检测到用户已被商户取消权限，重置为申请状态:', {
            approvalStatus: merchantUser.approvalStatus,
            isActive: merchantUser.isActive
          })
          // 重置为未绑定状态，使入口显示为"申请绑定商户操作员"
          merchantBindingStatus.value = {
            hasBinding: false
          }
        } else {
          // 权限正常，保持原状态
          merchantBindingStatus.value = statusResult
        }
      } else {
        // 未绑定或没有商户用户信息，直接使用原状态
        merchantBindingStatus.value = statusResult
      }
      console.log('📊 商户绑定状态详情:', {
        hasBinding: statusResult.hasBinding,
        merchantUser: statusResult.merchantUser ? {
          id: statusResult.merchantUser.id,
          merchantId: statusResult.merchantUser.merchantId,
          merchantName: statusResult.merchantUser.merchantName,
          merchantCode: statusResult.merchantUser.merchantCode,
          role: statusResult.merchantUser.role,
          approvalStatus: statusResult.merchantUser.approvalStatus,
          isActive: statusResult.merchantUser.isActive,
          appliedAt: statusResult.merchantUser.appliedAt,
          approvedAt: statusResult.merchantUser.approvedAt
        } : null
      })
    } catch (statusError) {
      console.warn('⚠️ 获取商户绑定状态失败:', statusError)
      // 绑定状态加载失败不影响页面展示
    }
  }

  // 跳转到商户管理
  const goToMerchantManagement = async () => {
    try {
      // 防止重复点击
      if (isNavigatingToMerchant.value) {
        console.warn('⚠️ [个人中心] 正在跳转中，忽略重复点击')
        return
      }
      
      console.log('🚀 [个人中心] 准备进入商户管理页面')
      console.log('📊 [个人中心] 当前商户绑定状态:', JSON.stringify(merchantBindingStatus.value, null, 2))
      
      // 检查循环跳转保护
      const redirectKey = 'merchant_redirect_count'
      const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
      if (redirectCount >= 3) {
        console.error('❌ [个人中心] 检测到循环跳转，中断跳转')
        sessionStorage.removeItem(redirectKey)
        showToast('跳转异常，请刷新页面重试')
        return
      }
      
      isNavigatingToMerchant.value = true
      
      // 已绑定且审核通过，直接跳转到商户管理页面
      // 不需要再次检查状态，因为页面加载时已经检查过了
      if (merchantBindingStatus.value?.hasBinding && 
          merchantBindingStatus.value?.merchantUser?.approvalStatus === 'APPROVED' && 
          merchantBindingStatus.value?.merchantUser?.isActive) {
        console.log('✅ [个人中心] 状态检查通过，切换到商户模式')
        
        // 切换到商户模式
        const appStore = useAppStore()
        appStore.switchToMerchant()
        
        // 记录跳转次数
        sessionStorage.setItem(redirectKey, String(redirectCount + 1))
        
        // 直接跳转到商户管理页面
        router.push('/merchant').finally(() => {
          // 清除标记，允许下次跳转
          setTimeout(() => {
            isNavigatingToMerchant.value = false
            sessionStorage.removeItem(redirectKey)
          }, 2000)
        })
        return
      }
      
      // 如果状态不确定，先刷新状态
      try {
        const statusResult = await merchantOperatorService.getMyStatus()
        merchantBindingStatus.value = statusResult
        console.log('✅ [个人中心] 商户绑定状态已更新:', statusResult)
        
        // 刷新后再次检查
        if (statusResult.hasBinding && 
            statusResult.merchantUser?.approvalStatus === 'APPROVED' && 
            statusResult.merchantUser?.isActive) {
          console.log('✅ [个人中心] 刷新后状态检查通过，切换到商户模式')
          const appStore = useAppStore()
          appStore.switchToMerchant()
          
          // 记录跳转次数
          const redirectKey = 'merchant_redirect_count'
          const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
          sessionStorage.setItem(redirectKey, String(redirectCount + 1))
          
          router.push('/merchant').finally(() => {
            setTimeout(() => {
              isNavigatingToMerchant.value = false
              sessionStorage.removeItem(redirectKey)
            }, 2000)
          })
          return
        }
      } catch (statusError) {
        console.warn('⚠️ [个人中心] 获取商户绑定状态失败:', statusError)
        isNavigatingToMerchant.value = false
      }
      
      // 如果未绑定，跳转到申请页面
      if (!merchantBindingStatus.value?.hasBinding) {
        console.log('⚠️ [个人中心] 未绑定商户，跳转到申请页面')
        router.push('/customer/merchant-binding')
        return
      }

      const merchantUser = merchantBindingStatus.value.merchantUser
      
      // 如果已绑定但未审核通过，提示用户
      if (merchantUser?.approvalStatus !== 'APPROVED' || !merchantUser?.isActive) {
        console.log('⚠️ [个人中心] 商户状态未通过:', {
          approvalStatus: merchantUser?.approvalStatus,
          isActive: merchantUser?.isActive
        })
        
        if (merchantUser?.approvalStatus === 'PENDING') {
          showToast('您的申请正在审核中，请耐心等待')
          router.push('/customer/merchant-binding')
        } else if (merchantUser?.approvalStatus === 'REJECTED') {
          showToast('您的申请已被拒绝，请重新申请')
          router.push('/customer/merchant-binding')
        } else {
          showToast('您的商户权限已被取消')
          router.push('/customer/merchant-binding')
        }
        return
      }
    } catch (error) {
      console.error('❌ [个人中心] 跳转商户管理失败:', error)
      showToast('跳转失败，请重试')
      isNavigatingToMerchant.value = false
    }
  }

  return {
    merchantBindingStatus,
    merchantMenuTitle,
    merchantStatus,
    merchantStatusText,
    merchantStatusTagType,
    goToMerchantManagement,
    refreshMerchantStatus
  }
}
