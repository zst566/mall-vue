/**
 * 促销活动相关的工具函数
 */

/**
 * 格式化日期范围
 * @param start 开始时间
 * @param end 结束时间
 * @returns 格式化后的日期字符串，如 "01-01 至 01-31"
 */
export function formatDateRange(start: string, end: string): string {
  if (!start || !end) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
  return `${formatDate(startDate)} 至 ${formatDate(endDate)}`
}

/**
 * 判断活动是否在有效期内
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 是否在有效期内
 */
export function isActivityActive(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return true
  const now = new Date().getTime()
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  return now >= start && now <= end
}

/**
 * 计算剩余数量
 * @param promotionQuantity 总数量
 * @param soldQuantity 已售数量
 * @returns 剩余数量（不小于0）
 */
export function calculateLeftQuantity(
  promotionQuantity: number,
  soldQuantity: number
): number {
  return Math.max(0, (promotionQuantity || 0) - (soldQuantity || 0))
}

/**
 * 将十六进制颜色转换为 rgba
 * @param hex 十六进制颜色值，如 "#1989fa"
 * @param alpha 透明度，0-1之间
 * @returns rgba 颜色字符串
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 计算颜色的反色（用于创建强烈对比）
 * @param hex 十六进制颜色值
 * @returns rgb 颜色字符串
 */
export function invertColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  // 计算主题色的相对亮度（用于判断是深色还是浅色）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // 由于底部栏背景是主题色15%不透明度，背景相对较浅
  // 为了确保强烈对比，我们使用白色或接近白色的颜色
  // 如果主题色本身很亮（luminance > 0.7），则使用深色
  if (luminance > 0.7) {
    // 主题色很亮，使用深色反色
    const invertedR = Math.max(0, 255 - r - 50)
    const invertedG = Math.max(0, 255 - g - 50)
    const invertedB = Math.max(0, 255 - b - 50)
    return `rgb(${invertedR}, ${invertedG}, ${invertedB})`
  } else {
    // 主题色较暗，使用白色确保强烈对比
    return `rgb(255, 255, 255)`
  }
}







