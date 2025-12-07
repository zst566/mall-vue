<template>
  <van-popup
    v-model:show="isVisible"
    position="bottom"
    closeable
    round
    :style="{ height: '60%' }"
  >
    <div class="filter-popup">
      <h3>筛选订单</h3>

      <van-form @submit="handleSubmit">
        <!-- 状态筛选 -->
        <van-field name="status" label="订单状态" :rules="[{ required: false }]">
          <template #input>
            <van-picker
              v-model="localFilterParams.status as any"
              :columns="statusOptions"
              @confirm="handleStatusConfirm"
              @cancel="handleStatusCancel"
              :show-toolbar="false"
            />
          </template>
        </van-field>

        <!-- 时间范围 -->
        <van-field name="dateRange" label="时间范围" :rules="[{ required: false }]">
          <template #input>
            <van-field
              v-model="localFilterParams.dateRange as any"
              placeholder="选择时间范围"
              readonly
              @click="showDatePicker = true"
            />
          </template>
        </van-field>

        <!-- 搜索 -->
        <van-field
          v-model="localFilterParams.search"
          label="搜索"
          placeholder="输入订单号或客户名称"
          :rules="[{ required: false }]"
        />

        <div class="filter-actions">
          <van-button block type="primary" @click="handleSubmit">应用筛选</van-button>
          <van-button block @click="handleReset">重置筛选</van-button>
        </div>
      </van-form>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MerchantOrderStatus } from '@/types'

interface FilterParams {
  status: MerchantOrderStatus | ''
  dateRange: string[]
  search: string
  sortBy: 'createdAt' | 'paidAt' | 'verifiedAt' | 'refundedAt'
  sortOrder: 'asc' | 'desc'
}

interface StatusOption {
  text: string
  value: MerchantOrderStatus | ''
}

interface Props {
  modelValue: boolean
  filterParams: FilterParams
  statusOptions: StatusOption[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', params: FilterParams): void
  (e: 'reset'): void
}>()

const isVisible = ref(props.modelValue)
const showDatePicker = ref(false)
const localFilterParams = ref<FilterParams>({ ...props.filterParams })

watch(() => props.modelValue, (val) => {
  isVisible.value = val
})

watch(() => props.filterParams, (val) => {
  localFilterParams.value = { ...val }
}, { deep: true })

watch(isVisible, (val) => {
  emit('update:modelValue', val)
})

const handleSubmit = () => {
  // 更新父组件的 filterParams
  Object.assign(props.filterParams, localFilterParams.value)
  emit('submit', { ...localFilterParams.value })
}

const handleReset = () => {
  emit('reset')
}

const handleStatusConfirm = () => {
  // Status is already updated via v-model
}

const handleStatusCancel = () => {
  localFilterParams.value.status = ''
}
</script>

<style scoped lang="scss">
.filter-popup {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.filter-popup h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.filter-actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
