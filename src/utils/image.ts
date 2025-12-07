/**
 * 图片 URL 处理工具函数
 * 统一处理图片 URL，确保在不同环境下都能正确显示
 */

/**
 * 默认占位图路径
 * 用于商品主图、促销活动缩略图、用户头像等场景的默认占位图
 */
export const DEFAULT_PLACEHOLDER_IMAGE = '/WePark.png'

/**
 * 获取默认占位图 URL
 * @returns 默认占位图路径
 */
export function getDefaultImage(): string {
  return DEFAULT_PLACEHOLDER_IMAGE
}

/**
 * 处理图片 URL，确保可以正确显示
 * 如果 URL 为空或无效，返回默认占位图
 * @param url 图片 URL（可能是相对路径、OSS key 或绝对路径）
 * @param useDefault 是否在 URL 为空时使用默认占位图（默认 true）
 * @returns 处理后的图片 URL，如果 URL 为空且 useDefault 为 true，返回默认占位图
 */
export function getImageUrl(url: string | null | undefined, useDefault: boolean = true): string {
  if (!url) {
    return useDefault ? DEFAULT_PLACEHOLDER_IMAGE : ''
  }

  // 如果已经是完整的 URL（http:// 或 https://），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 如果已经是 /api/upload/file/ 格式的代理 URL，直接返回
  // 这是后端返回的标准格式，通过 nginx 代理访问 OSS
  if (url.startsWith('/api/upload/file/')) {
    return url
  }

  // 如果已经是以 /api/ 开头的其他路径，直接返回
  if (url.startsWith('/api/')) {
    return url
  }

  // 如果是以 / 开头的相对路径，加上 /api 前缀
  // 例如：/upload/file/xxx -> /api/upload/file/xxx
  if (url.startsWith('/')) {
    return `/api${url}`
  }

  // 其他情况（纯 OSS key 等，如 "common/2025/11/23/xxx.jpeg"）
  // 转换为 /api/upload/file/${key} 格式
  // 这是长期有效的代理 URL，通过 nginx 代理访问 OSS
  return `/api/upload/file/${url}`
}

/**
 * 获取图片缩略图 URL（如果支持图片处理）
 * @param url 原始图片 URL
 * @param width 缩略图宽度（默认 300）
 * @param height 缩略图高度（默认 300）
 * @param useDefault 是否在 URL 为空时使用默认占位图（默认 true）
 * @returns 缩略图 URL，如果 URL 为空且 useDefault 为 true，返回默认占位图
 */
export function getThumbnailUrl(
  url: string | null | undefined,
  width: number = 300,
  height: number = 300,
  useDefault: boolean = true
): string {
  const imageUrl = getImageUrl(url, useDefault)
  if (!imageUrl || imageUrl === DEFAULT_PLACEHOLDER_IMAGE) {
    return imageUrl || (useDefault ? DEFAULT_PLACEHOLDER_IMAGE : '')
  }

  // 如果 URL 包含 OSS 路径，尝试添加缩略图参数
  // OSS 图片处理参数：?x-oss-process=image/resize,w_200,h_200,m_lfit
  if (imageUrl.includes('oss-cn') || imageUrl.includes('/oss/')) {
    const separator = imageUrl.includes('?') ? '&' : '?'
    return `${imageUrl}${separator}x-oss-process=image/resize,w_${width},h_${height},m_lfit`
  }

  // 如果是代理 URL（/api/upload/file/...），直接返回（后端会处理）
  // 代理 URL 已经是长期有效的，不需要添加额外参数
  return imageUrl
}

/**
 * 检查图片 URL 是否有效
 * @param url 图片 URL
 * @returns 是否为有效的图片 URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false
  }

  // 检查是否为图片文件扩展名
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext))

  // 检查是否为图片 MIME 类型（在 URL 中）
  const hasImageMimeType = url.includes('image/')

  // 检查是否为代理 URL
  const isProxyUrl = url.includes('/api/upload/file/')

  return hasImageExtension || hasImageMimeType || isProxyUrl
}
