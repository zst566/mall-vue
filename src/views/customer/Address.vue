<template>
  <div class="address-page">
    <AppHeader :title="pageTitle" />

    <!-- 地址列表 -->
    <div class="address-list">
      <div class="address-header">
        <h2>收货地址</h2>
        <van-button type="primary" size="small" @click="goToAddAddress">
          <van-icon name="plus" />
          添加新地址
        </van-button>
      </div>

      <!-- 地址卡片列表 -->
      <div class="address-cards">
        <div
          v-for="address in addressList"
          :key="address.id"
          class="address-card"
          :class="{ 'is-default': address.isDefault }"
        >
          <div class="address-content">
            <div class="address-main">
              <div class="address-title">
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
                <span v-if="address.isDefault" class="default-tag">默认</span>
              </div>
              <div class="address-detail">
                {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
              </div>
            </div>
            <div class="address-actions">
              <van-button size="small" type="primary" plain @click="editAddress(address)">
                编辑
              </van-button>
              <van-button size="small" type="danger" plain @click="deleteAddress(address)">
                删除
              </van-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="addressList.length === 0" class="empty-state">
          <van-empty description="暂无收货地址">
            <van-button type="primary" @click="goToAddAddress">添加第一个地址</van-button>
          </van-empty>
        </div>
      </div>
    </div>

    <!-- 添加地址按钮 -->
    <div class="add-address-btn">
      <van-button type="primary" block round @click="goToAddAddress">
        <van-icon name="plus" />
        添加新地址
      </van-button>
    </div>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showLoadingToast, closeToast } from 'vant'
  import AppHeader from '@/components/common/AppHeader.vue'
  import AppFooter from '@/components/common/AppFooter.vue'
  import { useAddressStore } from '@/stores/address'

  interface Address {
    id: string
    name: string
    phone: string
    province: string
    city: string
    district: string
    detail: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }

  const router = useRouter()
  const addressStore = useAddressStore()

  const pageTitle = ref('地址管理')
  const addressList = ref<Address[]>([])

  // 加载地址列表
  const loadAddressList = async () => {
    try {
      showLoadingToast({
        message: '加载中...',
        forbidClick: true
      })

      const response = await addressStore.getAddressList()

      if (response.success) {
        addressList.value = response.data
        console.log('地址列表加载成功:', addressList.value)
      } else {
        showToast('加载地址失败')
      }
    } catch (error) {
      console.error('加载地址列表失败:', error)
      showToast('加载地址失败')
    } finally {
      closeToast()
    }
  }

  // 添加地址
  const goToAddAddress = () => {
    router.push({ name: 'AddressAdd' })
  }

  // 编辑地址
  const editAddress = (address: Address) => {
    router.push({
      name: 'AddressEdit',
      params: { id: address.id }
    })
  }

  // 删除地址
  const deleteAddress = async (address: Address) => {
    showLoadingToast({
      message: '加载中...',
      forbidClick: true
    })

    try {
      // 如果是默认地址，需要先取消默认
      if (address.isDefault) {
        showToast('不能删除默认地址，请先取消默认设置')
        closeToast()
        return
      }

      showToast({
        message: '确定要删除这个地址吗？',
        type: 'fail',
        duration: 2000,
        onClose: () => {
          closeToast()
          executeDelete(address)
        }
      })
    } catch (error) {
      closeToast()
      executeDelete(address)
    }
  }

  // 执行删除
  const executeDelete = async (address: Address) => {
    try {
      showLoadingToast({
        message: '删除中...',
        forbidClick: true
      })

      const response = await addressStore.deleteAddress(address.id)

      if (response.success) {
        showToast('删除成功')
        await loadAddressList() // 重新加载列表
      } else {
        showToast('删除失败')
      }
    } catch (error) {
      console.error('删除地址失败:', error)
      showToast('删除失败')
    } finally {
      closeToast()
    }
  }

  // 设置默认地址
  const setDefaultAddress = async (address: Address) => {
    try {
      showLoadingToast({
        message: '设置中...',
        forbidClick: true
      })

      const response = await addressStore.setDefaultAddress(address.id)

      if (response.success) {
        showToast('默认地址设置成功')
        await loadAddressList() // 重新加载列表
      } else {
        showToast('设置失败')
      }
    } catch (error) {
      console.error('设置默认地址失败:', error)
      showToast('设置失败')
    } finally {
      closeToast()
    }
  }

  // 生命周期
  onMounted(() => {
    loadAddressList()
  })
</script>

<style lang="scss" scoped>
  .address-page {
    min-height: 100vh;
    background-color: var(--van-background);
    display: flex;
    flex-direction: column;
  }

  .address-list {
    flex: 1;
    padding: 0 16px 100px;
  }

  .address-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--van-border-color);

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--van-text-color);
      margin: 0;
    }
  }

  .address-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .address-card {
    background: var(--van-background-2);
    border-radius: var(--van-radius-lg);
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &.is-default {
      border-color: #1989fa;
      background: rgba(25, 137, 250, 0.05);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  .address-content {
    .address-main {
      margin-bottom: 8px;

      .address-title {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .name {
          font-size: 16px;
          font-weight: 600;
          color: var(--van-text-color);
        }

        .phone {
          font-size: 14px;
          color: var(--van-text-color-3);
          margin-left: 8px;
        }

        .default-tag {
          margin-left: auto;
          padding: 4px 8px;
          background: #1989fa;
          color: white;
          font-size: 12px;
          border-radius: var(--van-radius-sm);
          font-weight: 500;
        }
      }

      .address-detail {
        font-size: 14px;
        color: var(--van-text-color-2);
        line-height: 1.5;
        margin-left: 4px;
      }
    }

    .address-actions {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      gap: 4px;

      .van-button {
        padding: 6px 12px;
        font-size: 12px;
        border-radius: var(--van-radius-md);
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;
    padding: 24px 0;
    min-height: 200px;
  }

  .add-address-btn {
    position: fixed;
    bottom: 70px;
    left: 0;
    right: 0;
    padding: 0 16px;
    z-index: 100;
  }

  // 暗色模式支持
  @media (prefers-color-scheme: dark) {
    .address-page {
      background-color: #1a1a1a;
    }

    .address-header {
      border-bottom-color: #333;
    }

    .address-card {
      background: #2a2a2a;
      border-color: #333;

      &.is-default {
        border-color: #1989fa;
        background: rgba(25, 137, 250, 0.1);
      }
    }

    .address-title .name {
      color: #fff;
    }

    .address-detail {
      color: #ccc;
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .address-list {
      padding: 0 12px 80px;
    }

    .address-card {
      padding: 8px;

      .address-title {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 4px;
        flex-direction: column;

        .name {
          font-size: 15px;
        }

        .phone {
          margin-left: 0;
          margin-top: 4px;
        }
      }
    }
  }
</style>
