<template>
  <div class="order-actions">
    <template v-if="order.status === 'pending'">
      <van-button type="primary" block @click="handlePayment">立即支付</van-button>
      <van-button type="default" block @click="handleCancel">取消订单</van-button>
    </template>
    <template v-else-if="order.status === 'paid'">
      <van-button 
        type="danger" 
        block 
        :disabled="!canRefund"
        @click="handleRefund"
      >
        申请退款
      </van-button>
      <div v-if="!canRefund" class="refund-disabled-tip">
        <van-notice-bar
          color="#ff976a"
          background="#fff7e6"
          left-icon="info-o"
          :text="refundDisabledReason"
        />
      </div>
      <van-button type="default" block @click="handleContinueShopping">继续购物</van-button>
    </template>
    <template v-else-if="order.status === 'refund_requested'">
      <van-button type="default" block @click="handleCancelRefund">撤销退款申请</van-button>
      <van-button type="default" block @click="handleContinueShopping">继续购物</van-button>
    </template>
    <template v-else-if="order.status === 'verified'">
      <van-button type="primary" block @click="handleReview">评价商品</van-button>
      <van-button type="default" block @click="handleBuyAgain">再次购买</van-button>
    </template>
    <van-button 
      v-if="order.status !== 'paid' && order.status !== 'refund_requested'" 
      type="default" 
      block 
      @click="handleContinueShopping"
    >
      继续购物
    </van-button>
  </div>
</template>

<script setup lang="ts">
import type { OrderStatus } from '@/types'

interface Props {
  order: {
    status: OrderStatus | string
  }
  canRefund: boolean
  refundDisabledReason: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'payment': []
  'cancel': []
  'refund': []
  'review': []
  'buy-again': []
  'continue-shopping': []
  'cancel-refund': []
}>()

const handlePayment = () => emit('payment')
const handleCancel = () => emit('cancel')
const handleRefund = () => emit('refund')
const handleReview = () => emit('review')
const handleBuyAgain = () => emit('buy-again')
const handleContinueShopping = () => emit('continue-shopping')
const handleCancelRefund = () => emit('cancel-refund')
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.order-actions {
  @include glassmorphism-card(base);
  padding: 20px;
  margin: 16px;
  margin-bottom: 12px;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .van-button {
    margin: 0;
  }

  .refund-disabled-tip {
    margin-top: -4px;
    margin-bottom: 4px;
  }
}
</style>





