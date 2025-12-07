<template>
  <van-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title=""
    :show-cancel-button="true"
    :confirm-button-text="'去设置'"
    :cancel-button-text="'取消'"
    @confirm="$emit('go-to-settings')"
    @cancel="$emit('update:modelValue', false)"
    :close-on-click-overlay="false"
    class="standard-confirm-dialog"
    :width="320"
  >
    <div class="dialog-content">
      <div class="dialog-icon">
        <van-icon name="warning-o" size="48" />
      </div>
      <h3 class="dialog-title">权限申请</h3>
      <p class="dialog-message">
        需要访问摄像头权限，<br />
        请允许以使用扫描功能
      </p>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'go-to-settings': []
}>()
</script>

<style lang="scss" scoped>
@use '@/styles/dialog-mixin.scss' as *;
</style>

