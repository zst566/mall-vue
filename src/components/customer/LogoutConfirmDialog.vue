<template>
  <van-dialog
    v-model:show="show"
    title=""
    :show-cancel-button="true"
    :confirm-button-text="'确定退出'"
    :cancel-button-text="'取消'"
    @confirm="$emit('confirm')"
    @cancel="close"
    :close-on-click-overlay="false"
    class="standard-confirm-dialog"
    :width="320"
  >
    <div class="dialog-content">
      <div class="dialog-icon">
        <van-icon name="warning-o" size="48" />
      </div>
      <h3 class="dialog-title">确认退出</h3>
      <p class="dialog-message">
        确定要退出登录吗？
      </p>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'confirm': []
}>()

const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const close = () => {
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
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






