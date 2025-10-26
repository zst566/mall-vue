<template>
  <div class="payment-example">
    <button @click="handlePayment">发起支付</button>
    <div v-if="loading">处理中...</div>
    <div v-if="result">结果: {{ result.success ? '成功' : '失败' }}</div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { sendPaymentRequest } from '@/utils/miniprogramBridge'

  const loading = ref(false)
  const result = ref<any>(null)

  const handlePayment = async () => {
    loading.value = true

    try {
      const res = await sendPaymentRequest({
        orderId: 'ORDER_123',
        amount: 9900,
        description: '商品购买'
      })

      result.value = res

      if (res.success) {
        console.log('✅ 支付成功！', res.data)
      } else {
        console.error('❌ 支付失败：', res.errMsg)
      }
    } catch (error) {
      console.error('支付异常：', error)
    } finally {
      loading.value = false
    }
  }
</script>
