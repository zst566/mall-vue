<template>
  <!-- 确认对话框：取消订单 -->
  <van-dialog
    v-model:show="showCancelOrderModel"
    title=""
    :show-cancel-button="true"
    :confirm-button-text="'确定'"
    :cancel-button-text="'取消'"
    @confirm="handleConfirmCancelOrder"
    @cancel="handleCancel"
    :close-on-click-overlay="false"
    class="standard-confirm-dialog"
    :width="320"
  >
    <div class="dialog-content">
      <div class="dialog-icon">
        <van-icon name="warning-o" size="48" />
      </div>
      <h3 class="dialog-title">取消订单</h3>
      <p class="dialog-message">
        确定要取消此订单吗？
      </p>
    </div>
  </van-dialog>

  <!-- 确认对话框：确认收货 -->
  <van-dialog
    v-model:show="showConfirmReceiveModel"
    title=""
    :show-cancel-button="true"
    :confirm-button-text="'确认收货'"
    :cancel-button-text="'再想想'"
    @confirm="handleConfirmReceive"
    @cancel="handleCancel"
    :close-on-click-overlay="false"
    class="standard-confirm-dialog"
    :width="320"
  >
    <div class="dialog-content">
      <div class="dialog-icon">
        <van-icon name="success" size="48" />
      </div>
      <h3 class="dialog-title">确认收货</h3>
      <p class="dialog-message">
        确认已收到商品吗？
      </p>
    </div>
  </van-dialog>

  <!-- 确认对话框：撤销退款申请 -->
  <van-dialog
    v-model:show="showCancelRefundModel"
    title=""
    :show-cancel-button="true"
    :confirm-button-text="'确定撤销'"
    :cancel-button-text="'取消'"
    @confirm="handleConfirmCancelRefund"
    @cancel="handleCancel"
    :close-on-click-overlay="false"
    class="standard-confirm-dialog"
    :width="320"
  >
    <div class="dialog-content">
      <div class="dialog-icon">
        <van-icon name="warning-o" size="48" />
      </div>
      <h3 class="dialog-title">撤销退款申请</h3>
      <p class="dialog-message">
        确定要撤销退款申请吗？<br />
        撤销后订单将恢复为"已支付（待使用）"状态。
      </p>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  showCancelOrder: boolean
  showConfirmReceive: boolean
  showCancelRefund: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:showCancelOrder': [value: boolean]
  'update:showConfirmReceive': [value: boolean]
  'update:showCancelRefund': [value: boolean]
  'confirm-cancel-order': []
  'confirm-receive': []
  'confirm-cancel-refund': []
  'cancel': []
}>()

const showCancelOrderModel = computed({
  get: () => props.showCancelOrder,
  set: (value) => emit('update:showCancelOrder', value)
})

const showConfirmReceiveModel = computed({
  get: () => props.showConfirmReceive,
  set: (value) => emit('update:showConfirmReceive', value)
})

const showCancelRefundModel = computed({
  get: () => props.showCancelRefund,
  set: (value) => emit('update:showCancelRefund', value)
})

const handleConfirmCancelOrder = () => {
  emit('confirm-cancel-order')
}

const handleConfirmReceive = () => {
  emit('confirm-receive')
}

const handleConfirmCancelRefund = () => {
  emit('confirm-cancel-refund')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;
@use '@/styles/dialog-mixin.scss' as *;

.standard-confirm-dialog {
  @include standard-dialog;
}

.dialog-content {
  @include dialog-content;
}

.dialog-icon {
  @include dialog-icon(#ff6b6b);
}

.dialog-title {
  @include dialog-title;
}

.dialog-message {
  @include dialog-message;
}
</style>

