/**
 * 订单相关的格式化工具函数
 */

/**
 * 格式化订单状态
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    pending_verification: '待核销',
    verified: '已核销',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
    refund_requested: '退款中',
    // 处理大写状态
    PENDING: '待支付',
    PAID: '已支付',
    PENDING_VERIFICATION: '待核销',
    VERIFIED: '已核销',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
    REFUND_REQUESTED: '退款中'
  }
  return statusMap[status] || status
}

/**
 * 格式化统计数字（最大显示99+）
 */
export const formatStatNumber = (num: number): string => {
  if (num > 99) {
    return '99+'
  }
  return num.toString()
}

/**
 * 规范化状态类名（用于CSS类名）
 */
export const normalizeStatusClass = (status: string): string => {
  if (!status) return ''
  // 将大写状态转换为小写，并处理下划线
  return status.toLowerCase().replace(/_/g, '_')
}

/**
 * 格式化时间
 */
export const formatTime = (time: string): string => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}




