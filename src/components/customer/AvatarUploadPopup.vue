<template>
  <van-popup v-model:show="show" position="bottom" round :style="{ height: '40%' }">
    <div class="avatar-popup">
      <div class="popup-header">
        <h3>更换头像</h3>
        <van-icon name="cross" @click="close" />
      </div>
      <div class="popup-content">
        <van-uploader
          :after-read="handleUpload as any"
          :max-size="5 * 1024 * 1024"
          :before-read="beforeUpload as any"
          preview-size="80"
          multiple
          :show-upload="false"
        />
        <div class="upload-tips">
          <p>支持 JPG、PNG 格式</p>
          <p>文件大小不超过 5MB</p>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  beforeAvatarUpload?: (file: File) => boolean
  handleAvatarUpload?: (file: File) => Promise<void>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'upload-success': [avatarUrl: string]
}>()

const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const close = () => {
  emit('update:show', false)
}

const beforeUpload = (file: File): boolean => {
  if (props.beforeAvatarUpload) {
    return props.beforeAvatarUpload(file)
  }
  return true
}

const handleUpload = async (file: File) => {
  if (props.handleAvatarUpload) {
    await props.handleAvatarUpload(file)
    // 上传成功后，通过事件通知父组件
    // 注意：这里假设 handleAvatarUpload 内部已经更新了用户信息
    // 如果需要传递 avatarUrl，需要修改 handleAvatarUpload 的返回值
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.avatar-popup {
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 18px;
    border-bottom: 1px solid #ebedf0;
    @include glassmorphism-card(light);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #323233;
      letter-spacing: 0.3px;
    }

    .van-icon {
      cursor: pointer;
      font-size: 22px;
      color: #969799;
      transition: color 0.2s ease;

      &:hover {
        color: #323233;
      }
    }
  }

  .popup-content {
    padding: 24px 18px;

    .upload-tips {
      margin-top: 20px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #f7f9fc 0%, #ecf0f5 100%);
      border-radius: 10px;
      border: 1px solid #e6e9ef;

      p {
        font-size: 13px;
        color: #646566;
        margin-bottom: 6px;
        font-weight: 500;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>






