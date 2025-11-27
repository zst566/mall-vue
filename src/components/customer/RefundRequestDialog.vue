<template>
  <van-dialog
    v-model:show="visible"
    title="申请退款"
    :show-cancel-button="true"
    :confirm-button-text="'提交'"
    :cancel-button-text="'取消'"
    @confirm="handleSubmit"
    @cancel="handleCancel"
    :close-on-click-overlay="false"
    class="refund-request-dialog standard-confirm-dialog"
    :width="320"
  >
    <div class="refund-form">
      <!-- 退款原因 -->
      <div class="form-item">
        <label class="form-label required">退款原因</label>
        <van-field
          v-model="formData.refundReasonId"
          placeholder="请选择退款原因"
          readonly
          is-link
          @click="showReasonPicker = true"
          :rules="[{ required: true, message: '请选择退款原因' }]"
        />
        <van-picker
          v-model:show="showReasonPicker"
          :columns="refundReasonColumns"
          @confirm="onReasonConfirm"
          @cancel="showReasonPicker = false"
        />
      </div>

      <!-- 申请金额 -->
      <div class="form-item">
        <label class="form-label">申请金额（可选）</label>
        <van-field
          v-model="formData.requestedAmount"
          type="number"
          placeholder="请输入申请金额，不超过订单实付金额"
          :rules="requestedAmountRules"
        />
        <div class="form-hint">订单实付金额：¥{{ formatMoney(maxAmount) }}</div>
      </div>

      <!-- 申请说明 -->
      <div class="form-item">
        <label class="form-label" :class="{ required: isOtherReason }">
          申请说明（{{ isOtherReason ? '必填' : '可选' }}）
        </label>
        <van-field
          v-model="formData.description"
          type="textarea"
          rows="3"
          placeholder="请填写退款说明"
          :rules="descriptionRules"
        />
        <div v-if="isOtherReason" class="form-hint">选择"其他原因"时，请填写具体原因</div>
      </div>

      <!-- 图片上传 -->
      <div class="form-item">
        <label class="form-label">图片凭证（可选，最多5张）</label>
        <van-uploader
          v-model="imageList"
          :max-count="5"
          :max-size="5 * 1024 * 1024"
          :after-read="afterRead"
          :before-delete="beforeDelete"
          :accept="'image/jpeg,image/jpg,image/png,image/gif'"
          :preview-full-image="true"
          :preview-options="{ closeable: true }"
        >
          <template #preview-cover="{ file }">
            <div class="preview-cover">
              <van-icon name="delete" @click.stop="removeImage(file)" />
            </div>
          </template>
        </van-uploader>
        <div class="form-hint">支持 JPG、PNG、GIF 格式，单张不超过 5MB</div>
      </div>

      <!-- 联系电话 -->
      <div class="form-item">
        <label class="form-label">联系电话（可选）</label>
        <van-field
          v-model="formData.contactPhone"
          type="tel"
          placeholder="请输入联系电话"
          :rules="contactPhoneRules"
        />
      </div>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { orderService } from '@/services/orders'
import { api } from '@/services/api'
import { formatMoney } from '@/utils/format'

interface Props {
  orderId: string
  maxAmount: number
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
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
const refundReasonColumns = computed(() => {
  return refundReasons.value.map(reason => ({
    text: reason.name,
    value: reason.id
  }))
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
      if (amount > props.maxAmount) {
        return `申请金额不能超过订单实付金额¥${formatMoney(props.maxAmount)}`
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

// 图片上传后处理
const afterRead = async (file: any) => {
  try {
    // 验证图片格式
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.file.type)) {
      showToast('只支持 JPG、PNG、GIF 格式的图片')
      imageList.value = imageList.value.filter(img => img !== file)
      return
    }

    // 验证图片大小
    if (file.file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过 5MB')
      imageList.value = imageList.value.filter(img => img !== file)
      return
    }

    // 上传图片到OSS
    showLoadingToast('上传中...')
    try {
      const uploadResult = await api.upload<{ url: string; key: string; path?: string }>('/upload', file.file, {
        module: 'refund'
      })
      
      // 获取图片URL（优先使用url，否则使用path）
      const imageUrl = uploadResult.url || uploadResult.path || ''
      if (imageUrl) {
        uploadedImages.value.push(imageUrl)
        file.url = imageUrl
        file.status = 'done'
        closeToast()
      } else {
        throw new Error('上传失败：未返回图片URL')
      }
    } catch (uploadError: any) {
      closeToast()
      throw uploadError
    }
  } catch (error: any) {
    console.error('图片上传失败:', error)
    showToast(error.message || '图片上传失败')
    imageList.value = imageList.value.filter(img => img !== file)
    closeToast()
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

// 选择退款原因
const onReasonConfirm = ({ selectedOptions }: any) => {
  if (selectedOptions && selectedOptions.length > 0) {
    formData.value.refundReasonId = selectedOptions[0].value
  }
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
      if (amount > props.maxAmount) {
        showToast(`申请金额不能超过订单实付金额¥${formatMoney(props.maxAmount)}`)
        return
      }
    }

    // 验证图片数量
    if (uploadedImages.value.length > 5) {
      showToast('最多只能上传5张图片')
      return
    }

    showLoadingToast('提交中...')

    // 提交退款申请
    await orderService.requestRefund(
      props.orderId,
      formData.value.refundReasonId,
      formData.value.requestedAmount ? parseFloat(formData.value.requestedAmount) : undefined,
      formData.value.description || undefined,
      uploadedImages.value.length > 0 ? uploadedImages.value : undefined,
      formData.value.contactPhone || undefined
    )

    closeToast()
    showToast('退款申请提交成功')
    emit('success')
    handleCancel()
  } catch (error: any) {
    closeToast()
    showToast(error.message || '提交退款申请失败')
  }
}

// 取消
const handleCancel = () => {
  // 重置表单
  formData.value = {
    refundReasonId: '',
    requestedAmount: '',
    description: '',
    contactPhone: ''
  }
  imageList.value = []
  uploadedImages.value = []
  visible.value = false
}

// 监听弹窗显示，加载退款原因
watch(visible, (val) => {
  if (val) {
    loadRefundReasons()
  }
})
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;
  @use '@/styles/dialog-mixin.scss' as *;

.refund-request-dialog {
  @include standard-dialog;

  :deep(.van-dialog__content) {
    padding: 20px;
  }
}

.refund-form {
  .form-item {
    margin-bottom: 20px;

    .form-label {
      display: block;
      font-size: 14px;
      color: #323233;
      margin-bottom: 8px;
      font-weight: 500;

      &.required::before {
        content: '*';
        color: #ee0a24;
        margin-right: 4px;
      }
    }

    .form-hint {
      font-size: 12px;
      color: #969799;
      margin-top: 4px;
    }
  }

  :deep(.van-uploader) {
    .van-uploader__upload {
      width: 80px;
      height: 80px;
      border: 1px dashed #dcdee0;
      border-radius: 4px;
    }

    .van-uploader__preview-image {
      width: 80px;
      height: 80px;
      border-radius: 4px;
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
    border-radius: 4px;

    .van-icon {
      color: #fff;
      font-size: 20px;
    }
  }
}
</style>

