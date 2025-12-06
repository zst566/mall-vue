/**
 * 扫描相关类型定义
 */

/**
 * 扫描结果类型
 */
export type ScanResultType = 'order' | 'product' | 'promotion' | 'payment'

/**
 * 扫描结果数据
 */
export interface ScanResultData {
  id: string
  orderId?: string
  orderNo: string
  productName: string
  quantity: number
  amount: number
  status: string
  purchasedAt: string
  verifiedAt?: string
  verificationResult?: any
}

/**
 * 扫描结果
 */
export interface ScanResult {
  type: ScanResultType
  title: string
  data: ScanResultData
}

/**
 * 扫描历史记录项
 */
export interface ScanHistoryItem {
  id: string
  type: ScanResultType
  title: string
  description: string
  scannedAt: string
  status: 'success' | 'error' | 'info' | 'warning'
  data: ScanResultData
}

/**
 * 核销选项
 */
export interface VerifyOptions {
  operatorName: string
  notes: string
}
