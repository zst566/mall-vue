<template>
  <div class="refund-request-page">
    <AppHeader :showBack="true" />

    <div class="refund-form-content">
      <van-form @submit="handleSubmit">
        <!-- 订单信息卡片 -->
        <div class="order-info-card">
          <div class="card-header">
            <van-icon name="orders-o" class="header-icon" />
            <span class="header-title">订单信息</span>
          </div>
          <div class="order-info-grid">
            <div class="info-cell">
              <span class="cell-label">订单号</span>
              <span class="cell-value">{{ order.orderNo }}</span>
            </div>
            <div class="info-cell">
              <span class="cell-label">订单金额</span>
              <span class="cell-value highlight">¥{{ formatMoney(order.finalAmount || order.totalAmount || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- 退款原因 -->
        <div class="form-card">
          <div class="form-header">
            <span class="form-title required">退款原因</span>
          </div>
          <van-field
            :model-value="selectedRefundReasonName || ''"
            name="refundReasonId"
            placeholder="请选择退款原因"
            readonly
            is-link
            @click="showReasonPicker = true"
            :rules="[{ required: true, message: '请选择退款原因' }]"
            class="form-field"
          />
        </div>
        
        <!-- 退款原因选择器（独立弹出层） -->
        <van-popup v-model:show="showReasonPicker" position="bottom" round>
          <van-picker
            :columns="refundReasonColumns"
            @confirm="onReasonConfirm"
            @cancel="onReasonCancel"
            :show-toolbar="true"
          />
        </van-popup>

        <!-- 申请金额 -->
        <div class="form-card">
          <div class="form-header">
            <span class="form-title">申请金额</span>
            <span class="form-optional">可选</span>
          </div>
          <van-field
            v-model="formData.requestedAmount"
            name="requestedAmount"
            type="number"
            placeholder="请输入申请金额"
            :rules="requestedAmountRules"
            class="form-field"
          />
          <div class="form-hint">
            <van-icon name="info-o" />
            <span>订单实付金额：¥{{ formatMoney(maxAmount) }}</span>
          </div>
        </div>

        <!-- 申请说明 -->
        <div class="form-card">
          <div class="form-header">
            <span class="form-title" :class="{ required: isOtherReason }">
              申请说明
            </span>
            <span class="form-optional">{{ isOtherReason ? '必填' : '可选' }}</span>
          </div>
          <van-field
            v-model="formData.description"
            name="description"
            type="textarea"
            rows="4"
            placeholder="请填写退款说明"
            :rules="descriptionRules"
            maxlength="500"
            show-word-limit
            class="form-field"
          />
          <div v-if="isOtherReason" class="form-hint warning">
            <van-icon name="warning-o" />
            <span>选择"其他原因"时，请填写具体原因</span>
          </div>
        </div>

        <!-- 图片上传 -->
        <div class="form-card">
          <div class="form-header">
            <span class="form-title">图片凭证</span>
            <span class="form-optional">可选，最多5张</span>
          </div>
          <van-uploader
            v-model="imageList"
            :max-count="5"
            :max-size="5 * 1024 * 1024"
            :after-read="afterRead"
            :before-delete="beforeDelete"
            :accept="'image/jpeg,image/jpg,image/png,image/gif'"
            :preview-full-image="true"
            :preview-options="{ closeable: true }"
            multiple
            class="uploader-wrapper"
          >
            <template #preview-cover="{ file }">
              <div class="preview-cover">
                <van-icon name="delete" @click.stop="removeImage(file)" />
              </div>
            </template>
          </van-uploader>
          <div class="form-hint">
            <van-icon name="photo-o" />
            <span>支持 JPG、PNG、GIF 格式，单张不超过 5MB</span>
          </div>
        </div>

        <!-- 联系电话 -->
        <div class="form-card">
          <div class="form-header">
            <span class="form-title">联系电话</span>
            <span class="form-optional">可选</span>
          </div>
          <van-field
            v-model="formData.contactPhone"
            name="contactPhone"
            type="tel"
            placeholder="请输入联系电话"
            :rules="contactPhoneRules"
            maxlength="11"
            class="form-field"
          />
        </div>

        <!-- 提交按钮 -->
        <div class="submit-section">
          <van-button 
            type="danger" 
            block 
            native-type="submit" 
            :loading="submitting"
            round
            size="large"
            class="submit-button"
          >
            <van-icon name="checked" v-if="!submitting" />
            <span>{{ submitting ? '提交中...' : '提交退款申请' }}</span>
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { orderService } from '@/services/orders'
import { api } from '@/services/api'
import { formatMoney } from '@/utils/format'
import AppHeader from '@/components/common/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const orderId = computed(() => route.params.id as string)

// 订单信息
const order = ref<any>({
  id: '',
  orderNo: '',
  totalAmount: 0,
  finalAmount: 0 // 实付金额
})

const maxAmount = computed(() => {
  // 优先使用 finalAmount（实付金额），如果没有则使用 totalAmount
  return order.value.finalAmount || order.value.totalAmount || 0
})

const formData = ref({
  refundReasonId: '',
  requestedAmount: '',
  description: '',
  contactPhone: ''
})

const imageList = ref<any[]>([])
const uploadedImages = ref<string[]>([])
const showReasonPicker = ref(false)
const refundReasons = ref<Array<{ id: string; name: string }>>([])
const submitting = ref(false)

const refundReasonColumns = computed(() => {
  return refundReasons.value.map(reason => ({
    text: reason.name,
    value: reason.id
  }))
})

const selectedRefundReasonName = computed(() => {
  const selectedReason = refundReasons.value.find(r => r.id === formData.value.refundReasonId)
  return selectedReason?.name || ''
})

const isOtherReason = computed(() => {
  const selectedReason = refundReasons.value.find(r => r.id === formData.value.refundReasonId)
  return selectedReason?.name === '其他原因'
})

// 申请金额验证规则
const requestedAmountRules = computed(() => [
  {
    validator: (val: string) => {
      if (!val) return true
      const amount = parseFloat(val)
      if (isNaN(amount) || amount <= 0) {
        return '申请金额必须大于0'
      }
      if (amount > maxAmount.value) {
        return `申请金额不能超过订单实付金额¥${formatMoney(maxAmount.value)}`
      }
      return true
    }
  }
])

// 申请说明验证规则
const descriptionRules = computed(() => [
  {
    validator: (val: string) => {
      if (isOtherReason.value && (!val || val.trim().length === 0)) {
        return '选择"其他原因"时，请填写具体原因'
      }
      return true
    }
  }
])

// 联系电话验证规则
const contactPhoneRules = [
  {
    validator: (val: string) => {
      if (!val) return true
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(val)) {
        return '请输入正确的手机号码'
      }
      return true
    }
  }
]

// 加载订单信息
const loadOrderDetail = async () => {
  try {
    const orderDetail = await orderService.getOrderDetail(orderId.value)
    // 转换金额字段：后端返回的是字符串，需要转换为数字
    order.value = {
      ...orderDetail,
      totalAmount: typeof orderDetail.totalAmount === 'string' 
        ? parseFloat(orderDetail.totalAmount) 
        : (orderDetail.totalAmount || 0),
      finalAmount: typeof orderDetail.finalAmount === 'string' 
        ? parseFloat(orderDetail.finalAmount) 
        : (orderDetail.finalAmount || 0)
    }
    // 设置申请金额默认值为实付金额
    const finalAmount = order.value.finalAmount || order.value.totalAmount
    if (finalAmount) {
      formData.value.requestedAmount = finalAmount.toString()
    }
    // 设置联系电话默认值为用户手机号
    if (authStore.user?.phone && !formData.value.contactPhone) {
      formData.value.contactPhone = authStore.user.phone
    }
  } catch (error: any) {
    console.error('加载订单详情失败:', error)
    showToast(error.message || '加载订单详情失败')
    router.back()
  }
}

// 加载退款原因列表
const loadRefundReasons = async () => {
  try {
    const reasons = await orderService.getRefundReasons()
    refundReasons.value = reasons
  } catch (error: any) {
    console.error('加载退款原因失败:', error)
    showToast(error.message || '加载退款原因失败')
  }
}

// 图片上传后处理（支持单个文件或文件数组）
const afterRead = async (file: any) => {
  // 判断是单个文件还是文件数组
  const files = Array.isArray(file) ? file : [file]
  
  // 检查总数是否超过限制（Vant 已经将文件添加到 imageList 中）
  if (imageList.value.length > 5) {
    showToast('最多只能上传5张图片')
    // 移除超出部分的文件（保留前5个）
    const excessCount = imageList.value.length - 5
    // 移除最后添加的文件
    for (let i = 0; i < excessCount; i++) {
      imageList.value.pop()
    }
    return
  }

  // 批量处理文件
  const uploadPromises = files.map(async (item: any) => {
    try {
      // 验证图片格式
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!item.file || !allowedTypes.includes(item.file.type)) {
        showToast('只支持 JPG、PNG、GIF 格式的图片')
        item.status = 'failed'
        item.message = '格式不支持'
        // 延迟移除，让用户看到错误状态
        setTimeout(() => {
          imageList.value = imageList.value.filter(img => img !== item)
        }, 2000)
        return
      }

      // 验证图片大小
      if (item.file.size > 5 * 1024 * 1024) {
        showToast('图片大小不能超过 5MB')
        item.status = 'failed'
        item.message = '文件过大'
        // 延迟移除，让用户看到错误状态
        setTimeout(() => {
          imageList.value = imageList.value.filter(img => img !== item)
        }, 2000)
        return
      }

      // 设置上传中状态
      item.status = 'uploading'
      item.message = '上传中...'

      // 上传图片到OSS
      const uploadResult = await api.upload<{ url: string; key: string; path?: string }>('/upload', item.file, {
        module: 'refund'
      })
      
      // 获取图片URL（优先使用url，否则使用path）
      const imageUrl = uploadResult.url || uploadResult.path || ''
      if (imageUrl) {
        uploadedImages.value.push(imageUrl)
        item.url = imageUrl
        item.status = 'done'
        item.message = ''
      } else {
        throw new Error('上传失败：未返回图片URL')
      }
    } catch (error: any) {
      console.error('图片上传失败:', error)
      item.status = 'failed'
      item.message = error.message || '上传失败'
      // 不立即移除，让用户看到失败状态并可以手动删除
      showToast(error.message || '图片上传失败')
    }
  })

  // 显示上传提示
  if (files.length > 1) {
    showLoadingToast(`正在上传 ${files.length} 张图片...`)
  } else {
    showLoadingToast('上传中...')
  }

  // 等待所有文件上传完成
  await Promise.all(uploadPromises)
  closeToast()
  
  // 检查是否有上传成功的文件
  const successCount = files.filter((item: any) => item.status === 'done').length
  if (successCount > 0 && files.length > 1) {
    showToast(`成功上传 ${successCount} 张图片`)
  }
}

// 删除图片
const beforeDelete = (file: any) => {
  // 从已上传列表中移除
  if (file.url) {
    uploadedImages.value = uploadedImages.value.filter(url => url !== file.url)
  }
  return true
}

const removeImage = (file: any) => {
  imageList.value = imageList.value.filter(img => img !== file)
  if (file.url) {
    uploadedImages.value = uploadedImages.value.filter(url => url !== file.url)
  }
}

// 选择退款原因（确认按钮）
const onReasonConfirm = (value: any, selectedIndex: number) => {
  // Vant Picker 的 confirm 事件参数：
  // - value: 当使用对象数组 columns 时，value 是一个对象：
  //   {
  //     selectedValues: [选中的值数组],
  //     selectedOptions: [选中的选项对象数组 {text: '不想要了', value: 'id'}],
  //     selectedIndexes: [选中的索引数组]
  //   }
  // - selectedIndex: 选中的索引（可能为 undefined）
  
  // 优先使用 value.selectedIndexes（最可靠）
  if (value && value.selectedIndexes && Array.isArray(value.selectedIndexes) && value.selectedIndexes.length > 0) {
    const index = value.selectedIndexes[0]
    if (index >= 0 && refundReasons.value.length > index) {
      formData.value.refundReasonId = refundReasons.value[index].id
    }
  }
  // 使用 value.selectedOptions（对象数组）
  else if (value && value.selectedOptions && Array.isArray(value.selectedOptions) && value.selectedOptions.length > 0) {
    const selectedOption = value.selectedOptions[0]
    if (selectedOption && typeof selectedOption === 'object' && selectedOption.value) {
      formData.value.refundReasonId = selectedOption.value
    }
  }
  // 使用 value.selectedValues（值数组）
  else if (value && value.selectedValues && Array.isArray(value.selectedValues) && value.selectedValues.length > 0) {
    const selectedValue = value.selectedValues[0]
    if (typeof selectedValue === 'string') {
      const selectedReason = refundReasons.value.find(r => r.name === selectedValue)
      if (selectedReason) {
        formData.value.refundReasonId = selectedReason.id
      }
    } else if (typeof selectedValue === 'object' && selectedValue.value) {
      formData.value.refundReasonId = selectedValue.value
    }
  }
  // 兼容旧版本：使用 selectedIndex 参数
  else if (selectedIndex !== undefined && selectedIndex >= 0 && refundReasons.value.length > selectedIndex) {
    formData.value.refundReasonId = refundReasons.value[selectedIndex].id
  }
  // 兼容旧版本：value 直接是数组
  else if (Array.isArray(value) && value.length > 0) {
    const selectedValue = value[0]
    if (typeof selectedValue === 'object' && selectedValue.value) {
      formData.value.refundReasonId = selectedValue.value
    } else if (typeof selectedValue === 'string') {
      const selectedReason = refundReasons.value.find(r => r.name === selectedValue)
      if (selectedReason) {
        formData.value.refundReasonId = selectedReason.id
      }
    }
  }
  
  // 关闭选择器
  showReasonPicker.value = false
}

// 取消选择退款原因
const onReasonCancel = () => {
  showReasonPicker.value = false
}

// 提交表单
const handleSubmit = async () => {
  try {
    // 验证必填项
    if (!formData.value.refundReasonId) {
      showToast('请选择退款原因')
      return
    }

    // 验证"其他原因"必须填写说明
    if (isOtherReason.value && (!formData.value.description || formData.value.description.trim().length === 0)) {
      showToast('选择"其他原因"时，请填写具体原因')
      return
    }

    // 验证申请金额
    if (formData.value.requestedAmount) {
      const amount = parseFloat(formData.value.requestedAmount)
      if (isNaN(amount) || amount <= 0) {
        showToast('申请金额必须大于0')
        return
      }
      if (amount > maxAmount.value) {
        showToast(`申请金额不能超过订单实付金额¥${formatMoney(maxAmount.value)}`)
        return
      }
    }

    // 验证图片数量
    if (uploadedImages.value.length > 5) {
      showToast('最多只能上传5张图片')
      return
    }

    submitting.value = true
    showLoadingToast('提交中...')

    // 提交退款申请
    await orderService.requestRefund(
      orderId.value,
      formData.value.refundReasonId,
      formData.value.requestedAmount ? parseFloat(formData.value.requestedAmount) : undefined,
      formData.value.description || undefined,
      uploadedImages.value.length > 0 ? uploadedImages.value : undefined,
      formData.value.contactPhone || undefined
    )

    closeToast()
    submitting.value = false
    showToast('退款申请提交成功')
    
    // 返回订单详情页
    router.replace(`/order/${orderId.value}`)
  } catch (error: any) {
    closeToast()
    submitting.value = false
    showToast(error.message || '提交退款申请失败')
  }
}

onMounted(async () => {
  // 确保选择器初始状态为关闭
  showReasonPicker.value = false
  await loadOrderDetail()
  await loadRefundReasons()
})
</script>

<style lang="scss" scoped>
.refund-request-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #f7f8fa 100%);
}

.refund-form-content {
  padding: 12px;
  padding-bottom: calc(var(--tabbar-height) + 80px + env(safe-area-inset-bottom));
  box-sizing: border-box;

  // 订单信息卡片
  .order-info-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    margin-bottom: 16px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);

    .card-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .header-icon {
        font-size: 20px;
        color: rgba(255, 255, 255, 0.9);
        margin-right: 8px;
      }

      .header-title {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
      }
    }

    .order-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      .info-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .cell-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .cell-value {
          font-size: 16px;
          font-weight: 600;
          color: #fff;

          &.highlight {
            font-size: 18px;
            color: #ffd700;
          }
        }
      }
    }
  }

  // 表单卡片
  .form-card {
    background: #fff;
    padding: 16px;
    margin-bottom: 12px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .form-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .form-title {
        font-size: 15px;
        font-weight: 600;
        color: #323233;

        &.required::before {
          content: '*';
          color: #ee0a24;
          margin-right: 4px;
        }
      }

      .form-optional {
        font-size: 12px;
        color: #969799;
        background: #f7f8fa;
        padding: 2px 8px;
        border-radius: 10px;
      }
    }

    .form-field {
      :deep(.van-field__control) {
        font-size: 15px;
        min-height: auto;
        padding: 8px 0;
        line-height: 1.5;
      }

      :deep(.van-field__body) {
        min-height: auto;
        padding: 0;
      }

      :deep(.van-cell) {
        padding: 8px 0;
        min-height: auto;
      }

      :deep(.van-field__label) {
        margin-bottom: 0;
      }
    }

    .form-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #969799;
      margin-top: 8px;

      .van-icon {
        font-size: 14px;
      }

      &.warning {
        color: #ff976a;

        .van-icon {
          color: #ff976a;
        }
      }
    }
  }

  // 图片上传器
  .uploader-wrapper {
    :deep(.van-uploader) {
      .van-uploader__upload {
        width: 88px;
        height: 88px;
        border: 2px dashed #dcdee0;
        border-radius: 12px;
        background: #fafafa;
        transition: all 0.3s ease;

        &:active {
          border-color: #1989fa;
          background: #f0f8ff;
        }
      }

      .van-uploader__preview-image {
        width: 88px;
        height: 88px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .van-uploader__preview {
        margin-right: 8px;
        margin-bottom: 8px;
      }
    }
  }

  .preview-cover {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 1;
    }

    .van-icon {
      color: #fff;
      font-size: 24px;
    }
  }

  // 提交按钮区域
  .submit-section {
    position: fixed;
    bottom: calc(var(--tabbar-height) + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    padding: 12px 16px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
    background: #fff;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    z-index: 1040;

    .submit-button {
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(238, 10, 36, 0.3);
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.98);
        box-shadow: 0 2px 8px rgba(238, 10, 36, 0.3);
      }

      .van-icon {
        margin-right: 6px;
      }
    }
  }
}
</style>

