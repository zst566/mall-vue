/**
 * 促销活动标签管理 Composable
 */
import { ref, type Ref, type ComputedRef } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { PromotionTag } from '@/types/promotion'

export interface UsePromotionTagsOptions {
  tags: Ref<PromotionTag[]> | ComputedRef<PromotionTag[]>
}

export interface UsePromotionTagsReturn {
  tagPopoverVisible: Ref<Record<string, boolean>>
  getPopoverPlacement: (tagId: string) => 'top' | 'bottom'
  getPopoverOffset: (tagId: string) => [number, number]
  showTagDescription: (tagId: string) => void
  handleDocumentClick: (event: MouseEvent) => void
  setTagRef: (tagId: string, el: Element | ComponentPublicInstance | null) => void
}

/**
 * 处理促销活动标签交互
 */
export function usePromotionTags(
  tags: Ref<PromotionTag[]> | ComputedRef<PromotionTag[]>
): UsePromotionTagsReturn {
  const tagPopoverVisible = ref<Record<string, boolean>>({})
  const tagRefs = ref<Record<string, HTMLElement | null>>({})
  const tagPlacements = ref<Record<string, 'top' | 'bottom'>>({})

  // 设置标签引用
  const setTagRef = (tagId: string, el: Element | ComponentPublicInstance | null) => {
    if (el) {
      // 如果是组件实例，获取其 $el 属性；否则直接使用元素
      const htmlElement = (el as any).$el || el as HTMLElement
      tagRefs.value[tagId] = htmlElement
    }
  }

  // 动态计算每个标签的偏移量，确保提示框在视口内
  const getPopoverOffset = (tagId: string): [number, number] => {
    const tagElement = tagRefs.value[tagId]
    if (!tagElement) {
      return [0, 8] // 默认偏移：水平0，垂直8px
    }

    const rect = tagElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const minLeftMargin = 10
    const minRightMargin = 10

    // 估算提示框宽度（与 CSS 中的 max-width 保持一致）
    const estimatedPopoverWidth = Math.min(280, viewportWidth - 20)

    let xOffset = 0

    // 计算提示框默认居中显示时的左右边界
    const popoverLeft = rect.left + rect.width / 2 - estimatedPopoverWidth / 2
    const popoverRight = rect.left + rect.width / 2 + estimatedPopoverWidth / 2

    // 检查左边界
    if (popoverLeft < minLeftMargin) {
      // 需要向右偏移
      xOffset = minLeftMargin - popoverLeft
    }
    // 检查右边界
    else if (popoverRight > viewportWidth - minRightMargin) {
      // 需要向左偏移
      xOffset = (viewportWidth - minRightMargin) - popoverRight
    }

    return [xOffset, 8]
  }

  // 根据标签在视口中的位置智能选择提示框位置
  const getPopoverPlacement = (tagId: string): 'top' | 'bottom' => {
    // 如果已经计算过位置，直接返回
    if (tagPlacements.value[tagId]) {
      return tagPlacements.value[tagId]
    }

    const tagElement = tagRefs.value[tagId]
    if (!tagElement) {
      // 默认下方，等待 DOM 更新后重新计算
      return 'bottom'
    }

    const rect = tagElement.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const spaceTop = rect.top
    const spaceBottom = viewportHeight - rect.bottom

    // 估算提示框高度（包含内容、内边距和箭头），增加安全边距
    const estimatedPopoverHeight = 140
    const minTopMargin = 10
    const minBottomMargin = 10

    // 计算实际可用空间（减去安全边距）
    const availableSpaceTop = spaceTop - minTopMargin
    const availableSpaceBottom = spaceBottom - minBottomMargin

    // 优先选择空间更大的方向
    if (availableSpaceTop < estimatedPopoverHeight && availableSpaceBottom >= estimatedPopoverHeight) {
      // 上方空间不足，但下方有足够空间
      tagPlacements.value[tagId] = 'bottom'
      return 'bottom'
    } else if (availableSpaceBottom < estimatedPopoverHeight && availableSpaceTop >= estimatedPopoverHeight) {
      // 下方空间不足，但上方有足够空间
      tagPlacements.value[tagId] = 'top'
      return 'top'
    } else if (availableSpaceTop >= estimatedPopoverHeight && availableSpaceBottom >= estimatedPopoverHeight) {
      // 上下都有足够空间，优先选择下方
      tagPlacements.value[tagId] = 'bottom'
      return 'bottom'
    } else {
      // 上下空间都不足，选择空间更大的方向
      const placement: 'top' | 'bottom' = availableSpaceTop > availableSpaceBottom ? 'top' : 'bottom'
      tagPlacements.value[tagId] = placement
      return placement
    }
  }

  // 显示标签说明
  const showTagDescription = (tagId: string) => {
    // 直接切换显示状态（位置已通过 offset 和 placement 动态计算）
    tagPopoverVisible.value[tagId] = !tagPopoverVisible.value[tagId]
  }

  // 处理页面点击事件，点击外部时关闭所有提示框
  const handleDocumentClick = (event: MouseEvent) => {
    // 检查是否有打开的提示框
    const hasOpenPopover = Object.values(tagPopoverVisible.value).some(visible => visible)
    if (!hasOpenPopover) {
      return // 没有打开的提示框，不需要处理
    }
    
    const target = event.target as HTMLElement
    
    // 检查点击的目标是否在提示框内部或标签上
    const isClickInsidePopover = target.closest('.van-popover')
    const isClickOnTag = target.closest('.service-tag')
    
    // 如果点击在提示框外部且不在标签上，关闭所有提示框
    if (!isClickInsidePopover && !isClickOnTag) {
      // 关闭所有打开的提示框
      Object.keys(tagPopoverVisible.value).forEach(tagId => {
        if (tagPopoverVisible.value[tagId]) {
          tagPopoverVisible.value[tagId] = false
        }
      })
    }
  }

  return {
    tagPopoverVisible,
    getPopoverPlacement,
    getPopoverOffset,
    showTagDescription,
    handleDocumentClick,
    setTagRef,
  }
}
