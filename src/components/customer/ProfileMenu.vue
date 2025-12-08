<template>
  <div class="menu-section">
    <van-cell-group inset>
      <!-- 账户管理 
      <van-cell title="账户管理" is-link @click="handleMenuClick('account')">
        <template #icon>
          <van-icon name="user-o" />
        </template>
      </van-cell>-->

      <!-- 我的订单 
      <van-cell title="我的订单" is-link @click="handleMenuClick('orders')">
        <template #icon>
          <van-icon name="orders-o" />
        </template>
        <template #right-icon>
          <van-badge :dot="hasUnpaidOrders">
            <van-icon name="arrow" />
          </van-badge>
        </template>
      </van-cell>-->

      <!-- 收藏管理 
      <van-cell title="收藏管理" is-link @click="handleMenuClick('favorites')">
        <template #icon>
          <van-icon name="star-o" />
        </template>
      </van-cell>-->

      <!-- 地址管理 
      <van-cell title="地址管理" is-link @click="handleMenuClick('addresses')">
        <template #icon>
          <van-icon name="location-o" />
        </template>
      </van-cell>-->

      <!-- 安全设置 
      <van-cell title="安全设置" is-link @click="handleMenuClick('security')">
        <template #icon>
          <van-icon name="lock" />
        </template>
      </van-cell>-->

      <!-- 通知设置 
      <van-cell title="通知设置" is-link @click="handleMenuClick('notifications')">
        <template #icon>
          <van-icon name="bell" />
        </template>
      </van-cell>-->

      <!-- 商户管理 -->
      <van-cell :title="merchantMenuTitle" is-link @click="handleMenuClick('merchant')">
        <template #icon>
          <van-icon name="shop-o" />
        </template>
        <template #right-icon>
          <van-tag v-if="merchantStatus" :type="merchantStatusTagType as any">
            {{ merchantStatusText }}
          </van-tag>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 其他功能 -->
    <van-cell-group inset class="other-menu">
      <!-- 客服中心 
      <van-cell title="客服中心" is-link @click="handleMenuClick('service')">
        <template #icon>
          <van-icon name="service-o" />
        </template>
      </van-cell>-->

      <!-- 帮助中心 
      <van-cell title="帮助中心" is-link @click="handleMenuClick('help')">
        <template #icon>
          <van-icon name="question-o" />
        </template>
      </van-cell>-->

      <!-- 关于我们 
      <van-cell title="关于我们" is-link @click="handleMenuClick('about')">
        <template #icon>
          <van-icon name="info-o" />
        </template>
      </van-cell>-->

      <!-- 版本信息 -->
      <van-cell title="版本信息" is-link @click="handleMenuClick('version')">
        <template #icon>
          <van-icon name="version" />
        </template>
        <template #value>
          <span class="version-text">v{{ appVersion }}</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hasUnpaidOrders: boolean
  merchantStatus: string | null
  merchantStatusText: string
  merchantStatusTagType: string
  merchantMenuTitle: string
  appVersion: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'menu-click': [menuType: string]
}>()

const handleMenuClick = (menuType: string) => {
  emit('menu-click', menuType)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
@use '@/styles/mixins.scss' as *;

.menu-section {
  margin: 16px 12px;

  .van-cell-group {
    @include glassmorphism-card(base);
    overflow: hidden;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .van-cell {
      padding: 16px 18px;
      transition: background-color 0.2s ease;

      &:active {
        background-color: #f7f8fa;
      }

      .van-icon {
        margin-right: 12px;
        color: var(--primary-color);
        font-size: 18px;
      }
    }
  }
}

.version-text {
  color: #969799;
  font-size: 14px;
  font-weight: 500;
}

// 暗色模式支持
@media (prefers-color-scheme: dark) {
  .menu-section .van-cell-group {
    background: #242424;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);

    .van-cell {
      color: #e0e0e0;

      &:active {
        background-color: #2a2a2a;
      }
    }
  }
}

// 响应式设计
@media (max-width: 375px) {
  .menu-section {
    margin: 12px 10px;

    .van-cell-group .van-cell {
      padding: 14px 16px;
    }
  }
}

@media (max-width: 320px) {
  .menu-section {
    margin: 10px 8px;

    .van-cell-group .van-cell {
      padding: 13px 14px;

      .van-icon {
        margin-right: 10px;
        font-size: 16px;
      }
    }
  }
}
</style>
