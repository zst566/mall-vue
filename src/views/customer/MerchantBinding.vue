<template>
  <div class="merchant-binding-page">
    <van-nav-bar title="商户操作员申请" left-arrow @click-left="handleBack" />

    <!-- 加载状态 -->
    <van-loading v-if="isLoading" type="spinner" vertical>加载中...</van-loading>

    <!-- 内容区域 -->
    <div v-else class="content">
      <!-- 未绑定状态：申请表单（只有在没有任何商户用户记录时才显示） -->
      <div v-if="!status?.hasBinding && !status?.merchantUser" class="apply-section">
        <div class="section-header">
          <van-icon name="shop-o" size="48" color="#1989fa" />
          <h2>申请成为商户操作员</h2>
          <p class="description">请输入商户管理员提供的邀请码，提交申请后等待审核</p>
        </div>

        <van-form @submit="handleSubmit">
          <van-cell-group inset>
            <van-field
              v-model="inviteCode"
              name="inviteCode"
              label="邀请码"
              placeholder="请输入邀请码"
              :rules="[{ required: true, message: '请输入邀请码' }]"
              clearable
            />
            <van-field
              v-model="realName"
              name="realName"
              label="真实姓名"
              placeholder="请输入真实姓名"
              :rules="[{ required: true, message: '请输入真实姓名' }]"
              clearable
            />
            <van-field
              v-model="phone"
              name="phone"
              label="手机号"
              placeholder="请输入手机号"
              type="tel"
              :rules="[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
              ]"
              clearable
            />
          </van-cell-group>

          <div class="submit-section">
            <van-button
              type="primary"
              block
              round
              native-type="submit"
              :loading="isSubmitting"
              :disabled="!inviteCode.trim()"
            >
              提交申请
            </van-button>
          </div>
        </van-form>

        <div class="tips">
          <van-notice-bar left-icon="info-o" :scrollable="false">
            <div class="notice-content">
              <p><strong>申请须知：</strong></p>
              <ul>
                <li>邀请码由商户管理员生成并提供</li>
                <li>提交申请后，需要等待商户管理员审核</li>
                <li>审核通过后，您将获得该商户的操作权限</li>
                <li>如有疑问，请联系商户管理员</li>
              </ul>
            </div>
          </van-notice-bar>
        </div>
      </div>

      <!-- 已绑定状态或历史记录：显示申请信息 -->
      <div v-else class="status-section">
        <div class="status-card">
          <div class="status-header">
            <van-icon
              :name="statusIcon"
              size="48"
              :color="statusColor"
            />
            <h2>{{ statusTitle }}</h2>
            <p class="status-description">{{ statusDescription }}</p>
          </div>

          <van-cell-group inset>
            <van-cell title="商户名称" :value="status?.merchantUser?.merchantName || '-'" />
            <van-cell title="申请时间" :value="formatDate(status?.merchantUser?.appliedAt)" />
            <van-cell
              v-if="status?.merchantUser?.approvalStatus === 'APPROVED'"
              title="审核通过时间"
              :value="formatDate(status?.merchantUser?.approvedAt)"
            />
            <van-cell
              v-if="status?.merchantUser?.approvalStatus === 'REJECTED'"
              title="拒绝时间"
              :value="formatDate(status?.merchantUser?.rejectedAt)"
            />
            <van-cell
              v-if="status?.merchantUser?.approvalStatus === 'REJECTED' && status?.merchantUser?.rejectReason"
              title="拒绝原因"
              :value="status.merchantUser.rejectReason"
              :label="status.merchantUser.rejectReason"
            />
            <van-cell title="当前状态">
              <template #value>
                <van-tag :type="statusTagType" size="medium">
                  {{ statusText }}
                </van-tag>
              </template>
            </van-cell>
          </van-cell-group>

          <div class="action-section">
            <!-- 审核中：显示等待提示 -->
            <div v-if="status?.merchantUser?.approvalStatus === 'PENDING'" class="pending-actions">
              <van-button type="primary" block round disabled>
                等待审核中...
              </van-button>
              <p class="action-tip">请耐心等待商户管理员审核</p>
            </div>

            <!-- 已通过：可以进入商户管理 -->
            <div v-else-if="status?.merchantUser?.approvalStatus === 'APPROVED' && status?.merchantUser?.isActive" class="approved-actions">
              <van-button type="primary" block round @click="goToMerchantHome">
                进入商户管理
              </van-button>
            </div>

            <!-- 已拒绝：可以重新申请 -->
            <div v-else-if="status?.merchantUser?.approvalStatus === 'REJECTED'" class="rejected-actions">
              <van-button type="primary" block round @click="handleReapply">
                重新申请
              </van-button>
            </div>

            <!-- 已取消：可以重新申请 -->
            <div v-else class="inactive-actions">
              <van-button type="primary" block round @click="handleReapply">
                重新申请
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { showToast, showConfirmDialog } from 'vant'
  import { merchantOperatorService, type MerchantOperatorStatus } from '@/services/merchantOperator'
  import { useAppStore } from '@/stores/app'

  const router = useRouter()
  const appStore = useAppStore()

  // 状态
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const inviteCode = ref('')
  const realName = ref('')
  const phone = ref('')
  const status = ref<MerchantOperatorStatus | null>(null)

  // 状态显示
  const statusTitle = computed(() => {
    if (!status.value?.merchantUser) return '申请状态'
    const approvalStatus = status.value.merchantUser.approvalStatus
    if (approvalStatus === 'PENDING') return '审核中'
    if (approvalStatus === 'APPROVED') return '审核通过'
    if (approvalStatus === 'REJECTED') return '申请被拒绝'
    return '申请状态'
  })

  const statusDescription = computed(() => {
    if (!status.value?.merchantUser) return ''
    const approvalStatus = status.value.merchantUser.approvalStatus
    if (approvalStatus === 'PENDING') return '您的申请正在审核中，请耐心等待'
    if (approvalStatus === 'APPROVED') return '恭喜！您的申请已通过审核，可以开始使用商户管理功能'
    if (approvalStatus === 'REJECTED') return '很抱歉，您的申请已被拒绝，可以联系商户管理员了解详情或重新申请'
    return ''
  })

  const statusIcon = computed(() => {
    if (!status.value?.merchantUser) return 'info-o'
    const approvalStatus = status.value.merchantUser.approvalStatus
    if (approvalStatus === 'PENDING') return 'clock-o'
    if (approvalStatus === 'APPROVED') return 'passed'
    if (approvalStatus === 'REJECTED') return 'close'
    return 'info-o'
  })

  const statusColor = computed(() => {
    if (!status.value?.merchantUser) return '#1989fa'
    const approvalStatus = status.value.merchantUser.approvalStatus
    if (approvalStatus === 'PENDING') return '#ff9800'
    if (approvalStatus === 'APPROVED') return '#07c160'
    if (approvalStatus === 'REJECTED') return '#ee0a24'
    return '#1989fa'
  })

  const statusText = computed(() => {
    if (!status.value?.merchantUser) return '未知'
    const approvalStatus = status.value.merchantUser.approvalStatus
    if (approvalStatus === 'PENDING') return '审核中'
    if (approvalStatus === 'APPROVED' && status.value.merchantUser.isActive) return '已激活'
    if (approvalStatus === 'APPROVED' && !status.value.merchantUser.isActive) return '已停用'
    if (approvalStatus === 'REJECTED') return '已拒绝'
    return '未知'
  })

  const statusTagType = computed(() => {
    if (!status.value?.merchantUser) return 'default'
    const approvalStatus = status.value.merchantUser.approvalStatus
    if (approvalStatus === 'PENDING') return 'warning'
    if (approvalStatus === 'APPROVED' && status.value.merchantUser.isActive) return 'success'
    if (approvalStatus === 'APPROVED' && !status.value.merchantUser.isActive) return 'default'
    if (approvalStatus === 'REJECTED') return 'danger'
    return 'default'
  })

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '-'
    }
  }

  // 防止循环跳转的标记
  const isRedirecting = ref(false)
  
  // 加载状态
  const loadStatus = async () => {
    try {
      // 防止重复执行
      if (isRedirecting.value) {
        console.warn('⚠️ [商户绑定] 正在跳转中，忽略重复加载')
        return
      }
      
      isLoading.value = true
      const result = await merchantOperatorService.getMyStatus()
      status.value = result
      
      // 如果已绑定且审核通过，自动跳转到商户管理页面（避免显示审核通过页面）
      if (result.hasBinding && result.merchantUser?.approvalStatus === 'APPROVED' && result.merchantUser?.isActive) {
        // 检查循环跳转保护
        const redirectKey = 'merchant_redirect_count'
        const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10)
        if (redirectCount >= 3) {
          console.error('❌ [商户绑定] 检测到循环跳转，中断跳转')
          sessionStorage.removeItem(redirectKey)
          showToast('跳转异常，请刷新页面重试')
          isLoading.value = false
          return
        }
        
        console.log('✅ [商户绑定] 已审核通过，自动跳转到商户管理页面')
        isRedirecting.value = true
        
        // 切换到商户模式
        appStore.switchToMerchant()
        
        // 记录跳转次数
        sessionStorage.setItem(redirectKey, String(redirectCount + 1))
        
        // 使用 replace 而不是 push，避免在历史记录中留下申请页面
        // 添加延迟，确保路由守卫已经执行完毕
        setTimeout(() => {
          router.replace('/merchant').finally(() => {
            // 清除标记
            setTimeout(() => {
              isRedirecting.value = false
              sessionStorage.removeItem(redirectKey)
            }, 2000)
          })
        }, 100)
        return
      }
    } catch (error: any) {
      console.error('加载状态失败:', error)
      // 如果查询失败，可能是未绑定，设置为未绑定状态
      status.value = { hasBinding: false }
      isRedirecting.value = false
    } finally {
      isLoading.value = false
    }
  }

  // 提交申请
  const handleSubmit = async () => {
    if (!inviteCode.value.trim()) {
      showToast('请输入邀请码')
      return
    }
    if (!realName.value.trim()) {
      showToast('请输入真实姓名')
      return
    }
    if (!phone.value.trim()) {
      showToast('请输入手机号')
      return
    }
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone.value.trim())) {
      showToast('手机号格式不正确')
      return
    }

    try {
      isSubmitting.value = true
      const result = await merchantOperatorService.applyOperator(
        inviteCode.value.trim(),
        realName.value.trim(),
        phone.value.trim()
      )
      
      showToast({ type: 'success', message: '申请提交成功，等待审核' })
      
      // 重新加载状态
      await loadStatus()
    } catch (error: any) {
      console.error('提交申请失败:', error)
      showToast(error.message || '提交申请失败，请重试')
    } finally {
      isSubmitting.value = false
    }
  }

  // 重新申请
  const handleReapply = () => {
    inviteCode.value = ''
    realName.value = ''
    phone.value = ''
    status.value = { hasBinding: false }
  }

  // 进入商户管理
  const goToMerchantHome = async () => {
    try {
      console.log('🚀 [商户绑定] 准备进入商户管理页面')
      
      // 先刷新状态，确保获取最新状态
      await loadStatus()
      
      // 再次检查状态
      if (!status.value?.hasBinding || !status.value?.merchantUser) {
        showToast('商户绑定状态异常，请刷新页面重试')
        return
      }
      
      const merchantUser = status.value.merchantUser
      if (merchantUser.approvalStatus !== 'APPROVED' || !merchantUser.isActive) {
        showToast('您的商户权限尚未激活，无法进入商户管理')
        return
      }
      
      console.log('✅ [商户绑定] 状态检查通过，切换到商户模式')
      
      // 切换到商户模式
      appStore.switchToMerchant()
      
      // 显示加载提示
      showToast({ type: 'loading', message: '正在跳转...', duration: 1000 })
      
      // 延迟跳转，确保状态已更新
      setTimeout(() => {
        console.log('✅ [商户绑定] 跳转到商户管理页面')
        router.push('/merchant')
      }, 500)
    } catch (error) {
      console.error('❌ [商户绑定] 跳转失败:', error)
      showToast('跳转失败，请重试')
    }
  }

  // 返回
  const handleBack = () => {
    router.back()
  }

  // 初始化
  onMounted(() => {
    loadStatus()
  })
</script>

<style lang="scss" scoped>
  @use '@/styles/variables.scss' as *;
  @use '@/styles/mixins.scss' as *;

  .merchant-binding-page {
    min-height: 100vh;
    background: var(--theme-bg-gradient, $glass-bg-gradient);
    background-attachment: fixed;
    background-size: cover;
  }

  .content {
    padding: 16px;
  }

  .apply-section {
    .section-header {
      text-align: center;
      padding: 32px 16px;
      
      .van-icon {
        margin-bottom: 16px;
      }

      h2 {
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 12px 0;
        color: #323233;
      }

      .description {
        font-size: 14px;
        color: #646566;
        line-height: 1.6;
        margin: 0;
      }
    }

    .submit-section {
      margin: 24px 0;
      padding: 0 16px;
    }

    .tips {
      margin-top: 24px;

      .notice-content {
        p {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        ul {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          line-height: 1.8;
          color: #646566;

          li {
            margin-bottom: 4px;
          }
        }
      }
    }
  }

  .status-section {
    .status-card {
      .status-header {
        text-align: center;
        padding: 32px 16px 24px;

        .van-icon {
          margin-bottom: 16px;
        }

        h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: #323233;
        }

        .status-description {
          font-size: 14px;
          color: #646566;
          line-height: 1.6;
          margin: 0;
        }
      }

      .action-section {
        margin-top: 24px;
        padding: 0 16px;

        .pending-actions,
        .approved-actions,
        .rejected-actions,
        .inactive-actions {
          .action-tip {
            margin-top: 12px;
            text-align: center;
            font-size: 13px;
            color: #969799;
          }
        }
      }
    }
  }
</style>

