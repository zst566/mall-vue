<template>
  <div class="placeholder-image" :style="{ width: width, height: height }">
    <svg :width="width" :height="height" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景 -->
      <rect width="200" height="200" fill="#f5f5f5" />

      <!-- wepark 文字 -->
      <text
        x="100"
        y="100"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, sans-serif"
        font-size="24"
        font-weight="bold"
        fill="#1989fa"
      >
        wepark
      </text>

      <!-- 装饰性元素 -->
      <circle cx="50" cy="50" r="8" fill="#1989fa" opacity="0.3" />
      <circle cx="150" cy="50" r="6" fill="#1989fa" opacity="0.2" />
      <circle cx="50" cy="150" r="6" fill="#1989fa" opacity="0.2" />
      <circle cx="150" cy="150" r="8" fill="#1989fa" opacity="0.3" />

      <!-- 边框 -->
      <rect width="200" height="200" fill="none" stroke="#e0e0e0" stroke-width="2" />
    </svg>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    width?: string
    height?: string
  }

  withDefaults(defineProps<Props>(), {
    width: '100%',
    height: '200px'
  })
</script>

<style lang="scss" scoped>
  .placeholder-image {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;

    svg {
      display: block;
    }
  }
</style>
