<template>
  <div class="points-exchange-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="积分兑换"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
      z-index="100"
    />

    <!-- 加载状态 -->
    <van-loading v-if="loading" type="spinner" vertical style="padding: 50px 0;">
      加载中...
    </van-loading>

    <!-- 兑换内容 -->
    <template v-else>
      <!-- 商品信息 -->
      <div class="product-section">
        <div class="product-content">
          <!-- 左侧：商品图片 -->
          <div class="product-image-wrapper">
            <img
              v-if="productImage"
              :src="productImage"
              :alt="promotionInfo.name"
              class="product-image"
              @error="handleImageError"
            />
            <PlaceholderImage v-else width="120px" height="120px" />
          </div>

          <!-- 右侧：商品信息 -->
          <div class="product-info">
            <h3 class="product-name">{{ promotionInfo.name }}</h3>
            <p class="product-desc" v-if="promotionInfo.description">
              {{ promotionInfo.description }}
            </p>
            <div class="product-spec" v-if="variantName">
              <span class="spec-label">规格：</span>
              <span class="spec-value">{{ variantName }}</span>
            </div>
            <div class="product-quantity">
              <span class="quantity-label">数量：</span>
              <span class="quantity-value">1</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 积分信息 -->
      <div class="points-section">
        <div class="points-item">
          <span class="points-label">当前可用积分</span>
          <span class="points-value current">{{ formatNumber(currentPoints) }}</span>
        </div>
        <div class="points-item">
          <span class="points-label">需要扣除积分</span>
          <span class="points-value required">{{ formatNumber(requiredPoints) }}</span>
        </div>
        <div class="points-item total">
          <span class="points-label">兑换后剩余积分</span>
          <span class="points-value remaining" :class="{ 'insufficient': remainingPoints < 0 }">
            {{ formatNumber(remainingPoints) }}
          </span>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="order-section">
        <div class="order-item">
          <span class="order-label">商品名称：</span>
          <span class="order-value">{{ promotionInfo.name }}</span>
        </div>
        <div class="order-item" v-if="variantName">
          <span class="order-label">规格：</span>
          <span class="order-value">{{ variantName }}</span>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="tips-section" v-if="remainingPoints < 0">
        <van-notice-bar
          type="danger"
          left-icon="warning-o"
          :text="`积分不足，当前积分：${formatNumber(currentPoints)}，所需积分：${formatNumber(requiredPoints)}`"
        />
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          type="primary"
          size="large"
          block
          :disabled="isProcessing || remainingPoints < 0"
          :loading="isProcessing"
          @click="confirmExchange"
          class="confirm-button"
        >
          {{ isProcessing ? '兑换中...' : '确认兑换' }}
        </van-button>
        <van-button
          size="large"
          block
          @click="onClickLeft"
          class="cancel-button"
        >
          取消
        </van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import { api } from '@/services/api'
import { orderService } from '@/services/orders'
import { PointsService } from '@/services/points'
import { useAuthStore } from '@/stores/auth'
import { getImageUrl, getDefaultImage } from '@/utils/image'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const pointsService = new PointsService()

// 页面状态
const loading = ref(true)
const isProcessing = ref(false)

// 促销活动信息
const promotionInfo = ref<{
  id: string
  name: string
  description?: string
  images: any
  settlementPrice?: number
  pointsValue?: number
}>({
  id: '',
  name: '',
  description: '',
  images: null,
  settlementPrice: 0,
  pointsValue: 20
})

// 规格信息
const variantId = ref<string | undefined>(undefined)
const variantName = ref<string>('')

// 积分信息
const currentPoints = ref(0)
const requiredPoints = ref(0)

// 计算剩余积分
const remainingPoints = computed(() => {
  return currentPoints.value - requiredPoints.value
})

// 获取商品图片
const productImage = computed(() => {
  if (!promotionInfo.value.images) return getDefaultImage()
  
  let imageUrl = ''
  if (Array.isArray(promotionInfo.value.images) && promotionInfo.value.images.length > 0) {
    const firstImg = promotionInfo.value.images[0]
    if (typeof firstImg === 'object' && firstImg !== null && firstImg.url) {
      imageUrl = firstImg.url
    } else if (typeof firstImg === 'string') {
      imageUrl = firstImg
    }
  } else if (typeof promotionInfo.value.images === 'string') {
    imageUrl = promotionInfo.value.images
  }
  
  return getImageUrl(imageUrl)
})

// 格式化数字（添加千分位）
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN')
}

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = getDefaultImage()
}

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 加载促销活动详情
const loadPromotionInfo = async () => {
  try {
    const promotionId = route.params.id as string
    if (!promotionId) {
      throw new Error('促销活动ID不存在')
    }

    // 获取规格ID（如果有）
    const variantIdParam = route.query.variantId as string | undefined
    if (variantIdParam) {
      variantId.value = variantIdParam
    }

    // 获取促销活动详情
    const data = await api.get<{
      id: string
      name: string
      description?: string
      images: any
      settlementPrice?: number
      pointsValue?: number
      variants?: Array<{
        id: string
        name: string
        settlementPrice?: number
        pointsValue?: number
        isDefault?: boolean
      }>
    }>(`/promotions/${promotionId}`)

    promotionInfo.value = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      images: data.images || null,
      settlementPrice: data.settlementPrice || 0,
      pointsValue: data.pointsValue || 20
    }

    // 处理规格信息
    if (variantId.value && data.variants && Array.isArray(data.variants)) {
      const variant = data.variants.find((v) => v.id === variantId.value)
      if (variant) {
        variantName.value = variant.name
        promotionInfo.value.settlementPrice = variant.settlementPrice || promotionInfo.value.settlementPrice
        promotionInfo.value.pointsValue = variant.pointsValue || promotionInfo.value.pointsValue
      }
    } else if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
      // 使用默认规格
      const defaultVariant = data.variants.find((v) => v.isDefault) || data.variants[0]
      variantName.value = defaultVariant.name
      variantId.value = defaultVariant.id
      promotionInfo.value.settlementPrice = defaultVariant.settlementPrice || promotionInfo.value.settlementPrice
      promotionInfo.value.pointsValue = defaultVariant.pointsValue || promotionInfo.value.pointsValue
    }

    // 计算所需积分
    const settlementPrice = promotionInfo.value.settlementPrice || 0
    const pointsValue = promotionInfo.value.pointsValue || 20
    requiredPoints.value = Math.round(settlementPrice * pointsValue)

    // 获取用户当前积分
    if (authStore.isAuthenticated && authStore.user) {
      currentPoints.value = await pointsService.getUserPoints(authStore.user.id)
    }
  } catch (error: any) {
    console.error('加载促销活动详情失败:', error)
    showToast(error.message || '加载失败，请稍后重试')
    setTimeout(() => {
      router.back()
    }, 1500)
  } finally {
    loading.value = false
    closeToast()
  }
}

// 确认兑换
const confirmExchange = async () => {
  // 检查登录状态
  if (!authStore.isAuthenticated || !authStore.user) {
    showToast('请先登录')
    router.push({ name: 'Login' })
    return
  }

  // 检查积分是否充足
  if (remainingPoints.value < 0) {
    showToast(`积分不足，当前积分：${formatNumber(currentPoints.value)}，所需积分：${formatNumber(requiredPoints.value)}`)
    return
  }

  // 防止重复提交
  if (isProcessing.value) {
    return
  }

  isProcessing.value = true
  showLoadingToast({
    message: '兑换中...',
    forbidClick: true,
    duration: 0
  })

  try {
    // 创建订单（后端会扣减积分）
    const result = await orderService.createPromotionOrder(
      promotionInfo.value.id,
      1,
      variantId.value
    )

    closeToast()
    showToast('兑换成功！')

    // 跳转到订单详情
    setTimeout(() => {
      router.push({ name: 'OrderDetail', params: { id: result.order.id } })
    }, 1500)
  } catch (error: any) {
    closeToast()
    showToast(error.message || '兑换失败，请稍后重试')
    isProcessing.value = false
  }
}

// 页面加载时初始化
onMounted(async () => {
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
    duration: 0
  })
  await loadPromotionInfo()
})
</script>

<style scoped lang="scss">
.points-exchange-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

.product-section {
  background: white;
  margin: 12px;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .product-content {
    display: flex;
    gap: 16px;
  }

  .product-image-wrapper {
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    background: #f5f5f5;

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .product-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 0;
      line-height: 1.4;
    }

    .product-desc {
      font-size: 14px;
      color: #666;
      margin: 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-spec,
    .product-quantity {
      font-size: 14px;
      color: #999;

      .spec-label,
      .quantity-label {
        margin-right: 4px;
      }

      .spec-value,
      .quantity-value {
        color: #333;
        font-weight: 500;
      }
    }
  }
}

.points-section {
  background: white;
  margin: 12px;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .points-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    &.total {
      margin-top: 8px;
      padding-top: 16px;
      border-top: 2px solid #f0f0f0;
    }

    .points-label {
      font-size: 14px;
      color: #666;
    }

    .points-value {
      font-size: 18px;
      font-weight: 600;

      &.current {
        color: #1989fa;
      }

      &.required {
        color: #ff6b6b;
      }

      &.remaining {
        color: #07c160;

        &.insufficient {
          color: #ff6b6b;
        }
      }
    }
  }
}

.order-section {
  background: white;
  margin: 12px;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .order-item {
    display: flex;
    padding: 8px 0;
    font-size: 14px;

    .order-label {
      color: #666;
      margin-right: 8px;
      min-width: 80px;
    }

    .order-value {
      color: #333;
      flex: 1;
    }
  }
}

.tips-section {
  margin: 12px;
}

.action-buttons {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .confirm-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 24px;

    &:disabled {
      opacity: 0.5;
    }
  }

  .cancel-button {
    background: white;
    color: #666;
    border: 1px solid #e0e0e0;
    height: 48px;
    font-size: 16px;
    border-radius: 24px;
  }
}
</style>




