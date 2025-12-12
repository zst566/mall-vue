<template>
  <div class="manual-input-container">
    <div class="input-section">
      <van-field
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        placeholder="请输入订单号或扫描二维码"
        clearable
        :disabled="isQuerying"
        class="order-input"
      >
        <template #left-icon>
          <van-icon name="orders-o" />
        </template>
      </van-field>
      <div class="input-actions">
        <van-button
          type="primary"
          size="large"
          round
          @click="$emit('query')"
          :loading="isQuerying"
          :disabled="!modelValue || !modelValue.trim()"
          class="query-button"
        >
          查询订单
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  isQuerying: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'query': []
}>()
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.manual-input-container {
  margin: 16px;
  @include glassmorphism-card(base);
  padding: 16px;
  border-radius: var(--van-radius-lg);

  .input-section {
    .order-input {
      margin-bottom: 12px;
      background: var(--van-background-2);
      border-radius: var(--van-radius-md);
    }

    .input-actions {
      .query-button {
        width: 100%;
      }
    }
  }
}
</style>







