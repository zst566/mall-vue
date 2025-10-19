<template>
  <div class="settlement-example">
    <van-nav-bar title="订单结算示例" left-arrow @click-left="$router.back()" />

    <div class="example-content">
      <van-form @submit="handleCalculateSettlement">
        <van-cell-group title="订单信息">
          <van-field
            v-model="form.orderId"
            name="orderId"
            label="订单ID"
            placeholder="请输入订单ID"
            :rules="[{ required: true, message: '请输入订单ID' }]"
          />
          <van-field
            v-model="form.totalAmount"
            name="totalAmount"
            label="订单金额(分)"
            type="number"
            placeholder="请输入订单金额"
            :rules="[{ required: true, message: '请输入订单金额' }]"
          />
          <van-field
            v-model="form.quantity"
            name="quantity"
            label="商品数量"
            type="number"
            placeholder="请输入商品数量"
            :rules="[{ required: true, message: '请输入商品数量' }]"
          />
        </van-cell-group>

        <van-cell-group title="支付方式">
          <van-field name="paymentMethod" label="支付方式">
            <template #input>
              <van-radio-group v-model="form.paymentMethod" direction="horizontal">
                <van-radio name="wechat">微信支付</van-radio>
                <van-radio name="alipay">支付宝</van-radio>
                <van-radio name="cash">现金支付</van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </van-cell-group>

        <van-cell-group title="分账模式">
          <van-field name="settlementMode" label="分账模式">
            <template #input>
              <van-radio-group v-model="form.settlementMode" direction="vertical">
                <van-radio name="normal_split">普通分账模式</van-radio>
                <van-radio name="mall_subsidy">商场补贴模式</van-radio>
                <van-radio name="points_exchange">积分兑换模式</van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </van-cell-group>

        <!-- 普通分账模式参数 -->
        <van-cell-group v-if="form.settlementMode === 'normal_split'" title="分账参数">
          <van-field
            v-model="form.splitRatio"
            name="splitRatio"
            label="分成比例"
            type="number"
            placeholder="0.8 (80%)"
            :rules="[{ required: true, message: '请输入分成比例' }]"
          />
        </van-cell-group>

        <!-- 商场补贴模式参数 -->
        <van-cell-group v-if="form.settlementMode === 'mall_subsidy'" title="补贴参数">
          <van-field
            v-model="form.subsidyAmount"
            name="subsidyAmount"
            label="补贴金额(分)"
            type="number"
            placeholder="请输入补贴金额"
            :rules="[{ required: true, message: '请输入补贴金额' }]"
          />
        </van-cell-group>

        <!-- 积分兑换模式参数 -->
        <van-cell-group v-if="form.settlementMode === 'points_exchange'" title="兑换参数">
          <van-field
            v-model="form.settlementPrice"
            name="settlementPrice"
            label="结算价(分)"
            type="number"
            placeholder="请输入结算价"
            :rules="[{ required: true, message: '请输入结算价' }]"
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button type="primary" native-type="submit" block :loading="loading">
            计算结算
          </van-button>
        </div>
      </van-form>

      <!-- 结算结果 -->
      <OrderSettlement
        v-if="settlementResult"
        :order-id="form.orderId"
        :settlement-result="settlementResult"
        :show-actions="true"
        @settlement-confirmed="handleSettlementConfirmed"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { showToast } from 'vant'
  import { useSettlementStore } from '@/stores/settlement'
  import OrderSettlement from '@/components/common/OrderSettlement.vue'
  import { OrderSettlementParams, OrderSettlementResult } from '@/types/payment'

  const settlementStore = useSettlementStore()

  const loading = ref(false)
  const settlementResult = ref<OrderSettlementResult | null>(null)

  const form = reactive<OrderSettlementParams>({
    orderId: '',
    totalAmount: 10000, // 100元
    paymentMethod: 'wechat',
    settlementMode: 'normal_split',
    splitRatio: 0.8,
    subsidyAmount: 300, // 3元
    settlementPrice: 6000, // 60元
    quantity: 1
  })

  const handleCalculateSettlement = async () => {
    loading.value = true

    try {
      const result = await settlementStore.calculateOrderSettlement(form)
      settlementResult.value = result

      showToast('结算计算成功')
    } catch (error) {
      showToast('结算计算失败')
    } finally {
      loading.value = false
    }
  }

  const handleSettlementConfirmed = (result: OrderSettlementResult) => {
    showToast('结算已确认')
    console.log('结算确认结果:', result)
  }
</script>

<style scoped>
  .settlement-example {
    min-height: 100vh;
    background-color: #f7f8fa;
  }

  .example-content {
    padding: 16px;
  }

  .form-actions {
    margin-top: 24px;
  }

  :deep(.van-cell-group__title) {
    font-weight: 600;
    color: #323233;
  }

  :deep(.van-radio-group) {
    margin-top: 8px;
  }
</style>
