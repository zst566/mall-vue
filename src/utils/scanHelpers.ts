/**
 * 扫描相关工具函数
 */
import type { ScanResultType } from '@/types/scan'

/**
 * 获取记录图标
 */
export function getRecordIcon(type: string): string {
  const iconMap: Record<string, string> = {
    order: 'orders-o',
    product: 'shopping-cart-o',
    promotion: 'gift-o',
    payment: 'paid-o'
  }
  return iconMap[type] || 'scan'
}

/**
 * 获取结果图标
 */
export function getResultIcon(type: string): string {
  const iconMap: Record<string, string> = {
    order: 'orders-o',
    product: 'shopping-cart-o',
    promotion: 'gift-o'
  }
  return iconMap[type] || 'scan'
}

/**
 * 获取状态文本
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    success: '成功',
    error: '失败',
    info: '信息',
    warning: '警告'
  }
  return statusMap[status] || status
}

/**
 * 格式化时间
 */
export function formatTime(timeStr: string): string {
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 解析二维码数据，提取订单号
 */
export function parseQRCodeData(qrData: string): string | null {
  // 优先处理：如果是订单号格式（以 ORD 开头），直接作为订单号
  if (qrData.startsWith('ORD')) {
    return qrData
  }
  
  // 兼容处理：尝试解析为 JSON（旧格式）
  try {
    const parsed = JSON.parse(qrData)
    return parsed.orderNo || parsed.order_no || null
  } catch {
    // 如果不是 JSON，尝试作为订单号
    return qrData
  }
}







