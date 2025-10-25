<template>
  <div class="order-settlement">
    <van-cell-group title="订单结算信息" v-if="settlementResult">
      <van-cell title="订单实收金额" :value="formatAmount(settlementResult.actualAmount)" />
      <van-cell title="支付手续费" :value="formatAmount(settlementResult.paymentFee)" />
      <van-cell title="手续费率" :value="`${settlementResult.feeRate}%`" />
      <van-cell title="待结算金额" :value="formatAmount(settlementResult.settlementAmount)" />
    </van-cell-group>

    <van-cell-group title="分账明细" v-if="settlementResult">
      <van-cell
        v-for="detail in settlementResult.settlementDetails"
        :key="detail.type"
        :title="detail.description"
        :value="formatAmount(detail.amount)"
        :label="`分账比例: ${(detail.ratio * 100).toFixed(1)}%`"
      />
    </van-cell-group>

    <van-cell-group title="分账汇总" v-if="settlementResult">
      <van-cell title="商铺分账金额" :value="formatAmount(settlementResult.merchantAmount)" />
      <van-cell title="商场分账金额" :value="formatAmount(settlementResult.mallAmount)" />
    </van-cell-group>

    <div class="settlement-summary" v-if="settlementResult">
      <van-divider>结算摘要</van-divider>
      <div class="summary-content">
        <p>订单实收：{{ formatAmount(settlementResult.actualAmount) }}元</p>
        <p>
          支付手续费：{{ formatAmount(settlementResult.paymentFee) }}元（费率：{{
            settlementResult.feeRate
          }}%）
        </p>
        <p>待结算金额：{{ formatAmount(settlementResult.settlementAmount) }}元</p>
        <p>商铺分账：{{ formatAmount(settlementResult.merchantAmount) }}元</p>
        <p>商场分账：{{ formatAmount(settlementResult.mallAmount) }}元</p>
      </div>
    </div>

    <div class="settlement-actions" v-if="showActions">
      <van-button type="primary" block :loading="loading" @click="handleConfirmSettlement">
        确认结算
      </van-button>
    </div>

    <van-loading v-if="loading" class="loading-center" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { showToast, showConfirmDialog } from 'vant'
  import { useSettlementStore } from '@/stores/settlement'
  import type { OrderSettlementResult } from '@/types/payment'

  interface Props {
    orderId: string
    settlementResult?: OrderSettlementResult
    showActions?: boolean
  }

  interface Emits {
    (e: 'settlement-confirmed', result: OrderSettlementResult): void
  }

  const props = withDefaults(defineProps<Props>(), {
    showActions: true
  })

  const emit = defineEmits<Emits>()

  const settlementStore = useSettlementStore()

  const loading = computed(() => settlementStore.loading)

  const formatAmount = (amount: number): string => {
    return settlementStore.formatAmount(amount)
  }

  const handleConfirmSettlement = async () => {
    if (!props.settlementResult) {
      showToast('结算结果不存在')
      return
    }

    try {
      await showConfirmDialog({
        title: '确认结算',
        message: '确认执行此订单的结算操作吗？结算后将无法修改。',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      })

      await settlementStore.confirmOrderSettlement(props.orderId, props.settlementResult)

      showToast('结算确认成功')
      emit('settlement-confirmed', props.settlementResult)
    } catch (error) {
      if (error !== 'cancel') {
        showToast('结算确认失败')
      }
    }
  }
</script>

<style scoped>
  .order-settlement {
    padding: 16px;
  }

  .settlement-summary {
    margin-top: 16px;
  }

  .summary-content {
    padding: 16px;
    background-color: #f7f8fa;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
  }

  .summary-content p {
    margin: 4px 0;
    color: #323233;
  }

  .settlement-actions {
    margin-top: 24px;
  }

  .loading-center {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  :deep(.van-cell-group__title) {
    font-weight: 600;
    color: #323233;
  }

  :deep(.van-cell__title) {
    font-weight: 500;
  }

  :deep(.van-cell__value) {
    font-weight: 600;
    color: #1989fa;
  }
</style>
