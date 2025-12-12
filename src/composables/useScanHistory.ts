/**
 * 扫描历史 Composable
 */
import { ref, type Ref } from 'vue'
import { merchantOperatorService } from '@/services/merchantOperator'
import type { ScanHistoryItem } from '@/types/scan'

export interface UseScanHistoryReturn {
  scanHistory: Ref<ScanHistoryItem[]>
  loadRecentVerifications: () => Promise<void>
}

export function useScanHistory(): UseScanHistoryReturn {
  const scanHistory = ref<ScanHistoryItem[]>([])

  /**
   * 加载最近核销记录
   */
  const loadRecentVerifications = async (): Promise<void> => {
    try {
      const result = await merchantOperatorService.getVerifications({
        date: 'today',
        page: 1,
        pageSize: 5
      })
      
      // 将核销记录转换为扫描历史格式
      scanHistory.value = result.list.map((record: any) => ({
        id: record.id,
        type: 'order',
        title: '订单核销',
        description: record.promotionName || '商品',
        scannedAt: record.verifiedAt,
        status: 'success',
        data: {
          id: record.id,
          orderId: record.orderId,
          orderNo: record.orderNo,
          productName: record.promotionName || '商品',
          quantity: 1,
          amount: record.amount,
          status: 'verified',
          purchasedAt: record.verifiedAt
        }
      }))
    } catch (error: any) {
      console.error('加载核销记录失败:', error)
      // 静默失败，不影响主功能
    }
  }

  return {
    scanHistory,
    loadRecentVerifications
  }
}







