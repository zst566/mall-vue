<template>
  <div class="parking-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">停车服务</h1>
      <p class="page-subtitle">智能停车，便捷出行</p>
    </div>

    <!-- 停车功能卡片 -->
    <div class="parking-cards">
      <!-- 查找停车位 -->
      <van-card
        title="查找停车位"
        desc="实时查看商场停车位情况"
        thumb="https://img.yzcdn.cn/vant/cat.jpeg"
        @click="handleFindParking"
      >
        <template #tags>
          <van-tag type="primary">实时更新</van-tag>
        </template>
        <template #footer>
          <van-button size="small" type="primary">立即查找</van-button>
        </template>
      </van-card>

      <!-- 停车缴费 -->
      <van-card
        title="停车缴费"
        desc="快速支付停车费用"
        thumb="https://img.yzcdn.cn/vant/cat.jpeg"
        @click="handlePayParking"
      >
        <template #tags>
          <van-tag type="success">在线支付</van-tag>
        </template>
        <template #footer>
          <van-button size="small" type="success">立即缴费</van-button>
        </template>
      </van-card>

      <!-- 停车记录 -->
      <van-card
        title="停车记录"
        desc="查看历史停车记录"
        thumb="https://img.yzcdn.cn/vant/cat.jpeg"
        @click="handleParkingHistory"
      >
        <template #tags>
          <van-tag type="warning">历史记录</van-tag>
        </template>
        <template #footer>
          <van-button size="small" type="warning">查看记录</van-button>
        </template>
      </van-card>
    </div>

    <!-- 停车统计 -->
    <div class="parking-stats">
      <van-cell-group title="停车统计">
        <van-cell title="今日停车次数" :value="parkingStats.todayCount + '次'" />
        <van-cell title="本月停车费用" :value="'¥' + parkingStats.monthlyCost" />
        <van-cell title="累计停车时长" :value="parkingStats.totalHours + '小时'" />
      </van-cell-group>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <div class="parking-actions">
        <van-button type="primary" icon="location-o" @click="handleFindParking">找车位</van-button>
        <van-button type="success" icon="credit-pay" @click="handlePayParking">缴费</van-button>
        <van-button type="warning" icon="records" @click="handleParkingHistory">记录</van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast } from 'vant'

  const router = useRouter()

  // 停车统计数据
  const parkingStats = ref({
    todayCount: 0,
    monthlyCost: 0,
    totalHours: 0
  })

  // 查找停车位
  const handleFindParking = () => {
    showToast('正在查找停车位...')
    // TODO: 实现查找停车位逻辑
  }

  // 停车缴费
  const handlePayParking = () => {
    showToast('正在加载缴费页面...')
    // TODO: 实现停车缴费逻辑
  }

  // 查看停车记录
  const handleParkingHistory = () => {
    showToast('正在加载停车记录...')
    // TODO: 实现停车记录逻辑
  }

  // 初始化数据
  onMounted(() => {
    // TODO: 从API获取停车统计数据
    parkingStats.value = {
      todayCount: 3,
      monthlyCost: 45.5,
      totalHours: 12.5
    }
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .parking-page {
    padding: 16px;
    background: $glass-bg-gradient;
    background-attachment: fixed;
    background-size: cover;
    min-height: 100vh;
  }

  .page-header {
    text-align: center;
    margin-bottom: 24px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #323233;
      margin: 0 0 8px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #969799;
      margin: 0;
    }
  }

  .parking-cards {
    margin-bottom: 24px;

    .van-card {
      margin-bottom: 12px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .parking-stats {
    margin-bottom: 24px;

    .van-cell-group {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }

  .quick-actions {
    position: fixed;
    bottom: 80px;
    left: 16px;
    right: 16px;

    .parking-actions {
      width: 100%;
      display: flex;
      gap: 8px;

      .van-button {
        flex: 1;
        height: 48px;
        border-radius: 24px;
        font-size: 16px;
        font-weight: 500;
      }
    }
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .parking-page {
      background-color: #1a1a1a;
    }

    .page-title {
      color: #fff !important;
    }

    .page-subtitle {
      color: #7c7c7c !important;
    }
  }
</style>
