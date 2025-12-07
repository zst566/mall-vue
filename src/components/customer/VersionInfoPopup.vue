<template>
  <van-popup v-model:show="show" position="center" round :style="{ width: '80%' }">
    <div class="version-popup">
      <van-cell-group inset>
        <van-cell title="当前版本" :value="appVersion" />
        <van-cell title="更新时间" :value="updateTime" />
        <van-cell title="版本号" :value="buildVersion" />
      </van-cell-group>
      <div class="version-info">
        <h4>更新内容</h4>
        <ul>
          <li>优化用户界面体验</li>
          <li>修复已知问题</li>
          <li>提升系统性能</li>
          <li>新增多项功能</li>
        </ul>
      </div>
      <van-button type="primary" block round @click="close">确定</van-button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  appVersion: string
  buildVersion: string
  updateTime: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
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
.version-popup {
  .version-info {
    padding: 20px;

    h4 {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #323233;
      letter-spacing: 0.2px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        font-size: 14px;
        color: #646566;
        margin-bottom: 10px;
        padding-left: 20px;
        position: relative;
        line-height: 1.6;

        &:before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--primary-color);
          font-weight: 700;
          font-size: 16px;
        }

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .version-popup .version-info {
    h4 {
      color: #e0e0e0;
    }

    ul li {
      color: #b0b0b0;
    }
  }
}
</style>
