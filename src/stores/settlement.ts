import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  OrderSettlementParams, 
  OrderSettlementResult, 
  PaymentMethodConfig 
} from '@/types/payment'
import { orderSettlementService } from '@/services/settlement'
import { settlementApiService } from '@/services/settlement-api'

/**
 * 订单结算Store
 * 管理订单结算相关的状态和操作
 */
export const useSettlementStore = defineStore('settlement', () => {
  // 状态
  const settlementResults = ref<Map<string, OrderSettlementResult>>(new Map())
  const paymentConfigs = ref<PaymentMethodConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const hasSettlementResults = computed(() => settlementResults.value.size > 0)
  
  const totalSettlementAmount = computed(() => {
    let total = 0
    settlementResults.value.forEach(result => {
      total += result.settlementAmount
    })
    return total
  })

  const totalPaymentFee = computed(() => {
    let total = 0
    settlementResults.value.forEach(result => {
      total += result.paymentFee
    })
    return total
  })

  const totalMerchantAmount = computed(() => {
    let total = 0
    settlementResults.value.forEach(result => {
      total += result.merchantAmount
    })
    return total
  })

  const totalMallAmount = computed(() => {
    let total = 0
    settlementResults.value.forEach(result => {
      total += result.mallAmount
    })
    return total
  })

  // 获取支付方式配置
  const getPaymentConfig = computed(() => (method: string) => {
    return paymentConfigs.value.find(config => config.code === method)
  })

  // Actions
  /**
   * 计算订单结算
   * @param params 结算参数
   * @returns 结算结果
   */
  const calculateOrderSettlement = async (params: OrderSettlementParams): Promise<OrderSettlementResult> => {
    loading.value = true
    error.value = null

    try {
      // 使用本地服务计算结算
      const result = orderSettlementService.calculateOrderSettlement(params)
      
      // 验证结算结果
      const isValid = orderSettlementService.validateSettlementResult(result)
      if (!isValid) {
        throw new Error('结算计算结果验证失败')
      }

      // 存储结算结果
      settlementResults.value.set(params.orderId, result)

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '计算订单结算失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 确认订单结算
   * @param orderId 订单ID
   * @param settlementResult 结算结果
   */
  const confirmOrderSettlement = async (orderId: string, settlementResult: OrderSettlementResult): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await settlementApiService.confirmOrderSettlement(orderId, settlementResult)
      
      // 更新本地状态
      const currentResult = settlementResults.value.get(orderId)
      if (currentResult) {
        settlementResults.value.set(orderId, {
          ...currentResult,
          settlementStatus: 'settled' as any,
          settledAt: new Date().toISOString()
        })
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '确认订单结算失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载支付方式配置
   */
  const loadPaymentConfigs = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const configs = await settlementApiService.getPaymentMethodConfigs()
      paymentConfigs.value = configs
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载支付方式配置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新支付方式配置
   * @param config 支付方式配置
   */
  const updatePaymentConfig = async (config: PaymentMethodConfig): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const updatedConfig = await settlementApiService.updatePaymentMethodConfig(config)
      
      // 更新本地配置
      const index = paymentConfigs.value.findIndex(c => c.id === config.id)
      if (index !== -1) {
        paymentConfigs.value[index] = updatedConfig
      } else {
        paymentConfigs.value.push(updatedConfig)
      }

      // 更新本地服务配置
      orderSettlementService.updatePaymentConfig(updatedConfig)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新支付方式配置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取订单结算结果
   * @param orderId 订单ID
   * @returns 结算结果
   */
  const getOrderSettlementResult = (orderId: string): OrderSettlementResult | undefined => {
    return settlementResults.value.get(orderId)
  }

  /**
   * 批量计算订单结算
   * @param orderIds 订单ID列表
   */
  const batchCalculateSettlement = async (orderIds: string[]): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const results = await settlementApiService.batchCalculateSettlement(orderIds)
      
      // 存储批量结算结果
      Object.entries(results).forEach(([orderId, result]) => {
        settlementResults.value.set(orderId, result)
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量计算订单结算失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取结算统计
   * @param params 查询参数
   */
  const getSettlementStats = async (params: {
    startDate?: string
    endDate?: string
    merchantId?: string
    settlementMode?: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const stats = await settlementApiService.getSettlementStats(params)
      return stats
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取结算统计失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 导出结算报表
   * @param params 导出参数
   */
  const exportSettlementReport = async (params: {
    startDate?: string
    endDate?: string
    merchantId?: string
    settlementMode?: string
    format: 'excel' | 'csv' | 'pdf'
  }) => {
    loading.value = true
    error.value = null

    try {
      const result = await settlementApiService.exportSettlementReport(params)
      
      // 触发下载
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导出结算报表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 清除结算结果
   * @param orderId 订单ID（可选，不传则清除所有）
   */
  const clearSettlementResults = (orderId?: string) => {
    if (orderId) {
      settlementResults.value.delete(orderId)
    } else {
      settlementResults.value.clear()
    }
  }

  /**
   * 格式化金额显示
   * @param amount 金额（分）
   * @returns 格式化后的金额字符串
   */
  const formatAmount = (amount: number): string => {
    return orderSettlementService.formatAmount(amount)
  }

  /**
   * 获取结算摘要
   * @param result 结算结果
   * @returns 结算摘要
   */
  const getSettlementSummary = (result: OrderSettlementResult): string => {
    return orderSettlementService.getSettlementSummary(result)
  }

  return {
    // 状态
    settlementResults,
    paymentConfigs,
    loading,
    error,

    // 计算属性
    hasSettlementResults,
    totalSettlementAmount,
    totalPaymentFee,
    totalMerchantAmount,
    totalMallAmount,
    getPaymentConfig,

    // Actions
    calculateOrderSettlement,
    confirmOrderSettlement,
    loadPaymentConfigs,
    updatePaymentConfig,
    getOrderSettlementResult,
    batchCalculateSettlement,
    getSettlementStats,
    exportSettlementReport,
    clearError,
    clearSettlementResults,
    formatAmount,
    getSettlementSummary
  }
})
