<template>
  <div class="scan-area">
    <!-- 摄像头预览 -->
    <div class="camera-preview">
      <video 
        ref="videoRef" 
        :class="{ 'facing-front': isFrontCamera }" 
        autoplay 
        playsinline 
        v-show="isCameraReady"
        style="width: 100%; height: 100%; object-fit: cover;"
      />
      <canvas ref="canvasRef" class="scan-canvas" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !isCameraReady" class="loading-container">
      <van-loading type="spinner" size="24px">正在启动摄像头...</van-loading>
      <p style="margin-top: 16px; color: rgba(255,255,255,0.8); font-size: 12px;">
        如果长时间无响应，请检查摄像头权限
      </p>
    </div>

    <!-- 初始化失败状态 -->
    <div v-if="!loading && !isCameraReady && initError" class="error-container">
      <van-icon name="warning-o" size="48px" color="#ff6b6b" />
      <p class="error-message">{{ initError }}</p>
      <van-button type="primary" size="small" @click="$emit('retry-init')" style="margin-top: 16px;">
        重试
      </van-button>
    </div>

    <!-- 扫描框 -->
    <div class="scan-frame">
      <div class="scan-border">
        <div class="scan-corner top-left"></div>
        <div class="scan-corner top-right"></div>
        <div class="scan-corner bottom-left"></div>
        <div class="scan-corner bottom-right"></div>
      </div>
      <div class="scan-line" :class="{ scanning: isScanning }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isCameraReady: boolean
  isScanning: boolean
  loading: boolean
  initError: string | null
  isFrontCamera: boolean
}>()

defineEmits<{
  'retry-init': []
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

defineExpose({
  videoRef,
  canvasRef
})
</script>

<style lang="scss" scoped>
.scan-area {
  position: relative;
  aspect-ratio: 16/9;
  background: #000;
}

.camera-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;

    &.facing-front {
      transform: scaleX(-1);
    }
  }

  .scan-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: #000;
  color: white;
}

.error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: #000;
  padding: 20px;
  text-align: center;

  .error-message {
    color: var(--theme-text-on-glass, #333);
    font-size: 14px;
    margin-top: 16px;
    line-height: 1.6;
    white-space: pre-line;
    max-width: 80%;
  }
}

.scan-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  max-width: 300px;
  max-height: 300px;

  .scan-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: var(--van-radius-md);

    .scan-corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 3px solid var(--van-primary-color);

      &.top-left {
        top: -3px;
        left: -3px;
        border-right: none;
        border-bottom: none;
      }

      &.top-right {
        top: -3px;
        right: -3px;
        border-left: none;
        border-bottom: none;
      }

      &.bottom-left {
        bottom: -3px;
        left: -3px;
        border-right: none;
        border-top: none;
      }

      &.bottom-right {
        bottom: -3px;
        right: -3px;
        border-left: none;
        border-top: none;
      }
    }
  }

  .scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--van-primary-color), transparent);
    animation: scanLine 2s linear infinite;

    &.scanning {
      animation-play-state: running;
    }

    &:not(.scanning) {
      animation-play-state: paused;
    }
  }
}

@keyframes scanLine {
  0% {
    top: 0;
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}
</style>







