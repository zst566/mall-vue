// 格式化工具函数

/**
 * 格式化金额（元，保留两位小数，包含千分位分隔符）
 * @param amount 金额（元）
 * @returns 格式化后的金额字符串
 */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || typeof amount !== 'number' || isNaN(amount)) {
    return '0.00'
  }

  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模式
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

