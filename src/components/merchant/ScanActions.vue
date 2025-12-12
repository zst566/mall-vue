<template>
  <div class="scan-actions">
    <van-button
      v-if="!isScanning"
      type="primary"
      size="large"
      round
      @click="$emit('start-scan')"
      class="scan-button"
    >
      开始扫描
    </van-button>
    <van-button v-else type="danger" size="large" round @click="$emit('stop-scan')" class="stop-button">
      停止扫描
    </van-button>

    <!-- 切换摄像头 -->
    <van-button
      v-if="isScanning"
      type="default"
      size="large"
      round
      @click="$emit('toggle-camera')"
      class="switch-button"
    >
      <van-icon :name="isFrontCamera ? 'camera-o' : 'camera-reverse'" />
      切换摄像头
    </van-button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isScanning: boolean
  isFrontCamera: boolean
}>()

defineEmits<{
  'start-scan': []
  'stop-scan': []
  'toggle-camera': []
}>()
</script>

<style lang="scss" scoped>
.scan-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;

  .scan-button,
  .stop-button,
  .switch-button {
    flex: 1;
    max-width: 200px;
  }
}

@media (max-width: 375px) {
  .scan-actions {
    padding: 12px;
    gap: 8px;

    .van-button {
      max-width: 120px;
      font-size: 14px;
    }
  }
}
</style>







