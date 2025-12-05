/**
 * 促销活动图片处理 Composable
 */
import { computed, type Ref, type ComputedRef } from 'vue'

export interface UsePromotionImagesOptions {
  images: Ref<any> | ComputedRef<any>
}

export interface UsePromotionImagesReturn {
  mainImages: ComputedRef<any[]>
  detailImages: ComputedRef<any[]>
  getImageUrl: (image: any) => string
  handleImageError: (event: Event) => void
}

/**
 * 处理促销活动图片
 */
export function usePromotionImages(
  images: Ref<any> | ComputedRef<any>
): UsePromotionImagesReturn {
  // 主图列表（用于顶部banner）- 只显示主图，如无主图标记则显示第1张图
  const mainImages = computed(() => {
    const imagesValue = images.value
    
    if (!imagesValue) {
      return []
    }
    
    // 处理图片数据，支持多种格式
    let imageList: any[] = []
    
    if (Array.isArray(imagesValue)) {
      imageList = imagesValue
    } else if (typeof imagesValue === 'object' && imagesValue !== null) {
      // 如果是对象，尝试提取url
      if ('url' in imagesValue) {
        imageList = [imagesValue]
      }
    }
    
    if (imageList.length === 0) {
      return []
    }
    
    // 获取主图（isMain为true的图片）
    const mainImage = imageList.find((img: any) => {
      if (typeof img === 'string') return false
      return img.isMain === true
    })
    
    // 如果有主图，返回主图；否则返回第1张图
    return mainImage ? [mainImage] : [imageList[0]]
  })

  // 详情图片列表（显示所有图片，按排序逐个显示）
  const detailImages = computed(() => {
    const imagesValue = images.value
    if (!imagesValue) return []
    
    let imageList: any[] = []
    
    if (Array.isArray(imagesValue)) {
      imageList = imagesValue
    } else if (typeof imagesValue === 'object' && imagesValue !== null) {
      if ('url' in imagesValue) {
        imageList = [imagesValue]
      }
    }
    
    if (imageList.length === 0) return []
    
    // 处理图片数据，统一格式并提取排序字段
    const processedImages = imageList.map((img: any, index: number) => {
      if (typeof img === 'string') {
        return {
          url: img,
          position: index,
          id: '',
          isMain: false
        }
      }
      return {
        url: img.url || img.src || '',
        position: img.position ?? img.sortOrder ?? index,
        id: img.id || img.key || '',
        isMain: img.isMain === true,
        ...img // 保留其他字段
      }
    })
    
    // 按position/sortOrder排序，如果相同则保持原顺序
    return processedImages.sort((a: any, b: any) => {
      return (a.position ?? 0) - (b.position ?? 0)
    })
  })

  // 获取图片URL
  const getImageUrl = (image: any): string => {
    if (typeof image === 'string') {
      // 如果已经是完整 URL，直接返回
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image
      }
      // 如果已经包含 /api/ 前缀，直接返回
      if (image.startsWith('/api/')) {
        return image
      }
      // 如果是相对路径，添加 API 前缀
      if (image.startsWith('/')) {
        return `/api${image}`
      }
      return image
    }
    if (image && typeof image === 'object') {
      const url = image.url || image.src || image.key || ''
      
      // 如果已经是完整 URL，直接返回
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
      // 如果已经包含 /api/ 前缀，直接返回
      if (url.startsWith('/api/')) {
        return url
      }
      // 如果是相对路径，添加 API 前缀
      if (url && url.startsWith('/')) {
        return `/api${url}`
      }
      return url
    }
    return ''
  }

  // 图片加载错误处理
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement
    img.src = '/placeholder-product.png'
  }

  return {
    mainImages,
    detailImages,
    getImageUrl,
    handleImageError,
  }
}
