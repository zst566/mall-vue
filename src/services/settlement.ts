import type { 
  PaymentMethodConfig, 
  OrderSettlementParams, 
  OrderSettlementResult, 
  SettlementDetail,
  PaymentMethod 
} from '@/types/payment'

/**
 * 订单结算计算服务
 * 负责处理订单的支付手续费扣除和分账计算
 */
export class OrderSettlementService {
  private paymentConfigs: Map<PaymentMethod, PaymentMethodConfig> = new Map()

  constructor() {
    this.initializeDefaultConfigs()
  }

  /**
   * 初始化默认支付方式配置
   */
  private initializeDefaultConfigs(): void {
    const defaultConfigs: PaymentMethodConfig[] = [
      {
        id: 'wechat',
        name: '微信支付',
        code: 'wechat',
        feeRate: 0.6, // 0.6%
        enabled: true,
        minFee: 1, // 1分
        maxFee: 10000, // 100元
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'alipay',
        name: '支付宝',
        code: 'alipay',
        feeRate: 0.6, // 0.6%
        enabled: true,
        minFee: 1,
        maxFee: 10000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cash',
        name: '现金支付',
        code: 'cash',
        feeRate: 0, // 0%
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    defaultConfigs.forEach(config => {
      this.paymentConfigs.set(config.code, config)
    })
  }

  /**
   * 更新支付方式配置
   */
  updatePaymentConfig(config: PaymentMethodConfig): void {
    this.paymentConfigs.set(config.code, config)
  }

  /**
   * 获取支付方式配置
   */
  getPaymentConfig(paymentMethod: PaymentMethod): PaymentMethodConfig | undefined {
    return this.paymentConfigs.get(paymentMethod)
  }

  /**
   * 计算订单结算
   * @param params 结算参数
   * @returns 结算结果
   */
  calculateOrderSettlement(params: OrderSettlementParams): OrderSettlementResult {
    const { 
      totalAmount, 
      paymentMethod, 
      settlementMode, 
      splitRatio = 0.8, 
      subsidyAmount = 0, 
      settlementPrice = 0, 
      quantity 
    } = params

    // 1. 获取支付方式配置
    const paymentConfig = this.getPaymentConfig(paymentMethod)
    if (!paymentConfig) {
      throw new Error(`不支持的支付方式: ${paymentMethod}`)
    }

    // 2. 计算支付手续费
    const paymentFee = this.calculatePaymentFee(totalAmount, paymentConfig)
    
    // 3. 计算待结算金额（扣除手续费后）
    const settlementAmount = totalAmount - paymentFee

    // 4. 根据分账模式计算分账
    const settlementDetails = this.calculateSettlementDetails(
      settlementMode,
      settlementAmount,
      totalAmount,
      splitRatio,
      subsidyAmount,
      settlementPrice,
      quantity
    )

    // 5. 汇总分账金额
    const merchantAmount = settlementDetails
      .filter(detail => detail.type === 'merchant')
      .reduce((sum, detail) => sum + detail.amount, 0)
    
    const mallAmount = settlementDetails
      .filter(detail => detail.type === 'mall')
      .reduce((sum, detail) => sum + detail.amount, 0)

    return {
      actualAmount: totalAmount,
      paymentFee,
      settlementAmount,
      merchantAmount,
      mallAmount,
      feeRate: paymentConfig.feeRate,
      settlementDetails
    }
  }

  /**
   * 计算支付手续费
   * @param amount 订单金额（分）
   * @param config 支付方式配置
   * @returns 手续费（分）
   */
  private calculatePaymentFee(amount: number, config: PaymentMethodConfig): number {
    if (config.feeRate === 0) {
      return 0
    }

    // 计算手续费
    let fee = Math.round(amount * config.feeRate / 100)

    // 应用最小手续费限制
    if (config.minFee && fee < config.minFee) {
      fee = config.minFee
    }

    // 应用最大手续费限制
    if (config.maxFee && fee > config.maxFee) {
      fee = config.maxFee
    }

    return fee
  }

  /**
   * 计算分账明细
   * @param settlementMode 分账模式
   * @param settlementAmount 待结算金额
   * @param totalAmount 订单总金额
   * @param splitRatio 分成比例
   * @param subsidyAmount 补贴金额
   * @param settlementPrice 结算价
   * @param quantity 数量
   * @returns 分账明细
   */
  private calculateSettlementDetails(
    settlementMode: string,
    settlementAmount: number,
    totalAmount: number,
    splitRatio: number,
    subsidyAmount: number,
    settlementPrice: number,
    quantity: number
  ): SettlementDetail[] {
    const details: SettlementDetail[] = []

    switch (settlementMode) {
      case 'normal_split':
        // 普通分账模式：基于待结算金额进行分账
        const merchantAmount = Math.round(settlementAmount * splitRatio)
        const mallAmount = settlementAmount - merchantAmount
        
        details.push({
          type: 'merchant',
          amount: merchantAmount,
          ratio: splitRatio,
          description: `商铺分账：${(splitRatio * 100).toFixed(1)}%`
        })
        
        details.push({
          type: 'mall',
          amount: mallAmount,
          ratio: 1 - splitRatio,
          description: `商场分账：${((1 - splitRatio) * 100).toFixed(1)}%`
        })
        break

      case 'mall_subsidy':
        // 商场补贴模式：商场承担补贴，商铺获得待结算金额+补贴
        const mallSubsidyAmount = -subsidyAmount * quantity
        const merchantSubsidyAmount = settlementAmount - mallSubsidyAmount // 待结算金额 - 商场分账（负数）
        
        details.push({
          type: 'merchant',
          amount: merchantSubsidyAmount,
          ratio: 1,
          description: `商铺分账：待结算金额+商场补贴`
        })
        
        details.push({
          type: 'mall',
          amount: mallSubsidyAmount,
          ratio: -1,
          description: `商场补贴：-${subsidyAmount * quantity / 100}元`
        })
        break

      case 'points_exchange':
        // 积分兑换模式：商铺获得结算价，商场承担成本
        const merchantSettlementAmount = settlementPrice * quantity
        const mallCostAmount = -settlementPrice * quantity
        
        details.push({
          type: 'merchant',
          amount: merchantSettlementAmount,
          ratio: 1,
          description: `商铺分账：结算价 ${settlementPrice / 100}元/件`
        })
        
        details.push({
          type: 'mall',
          amount: mallCostAmount,
          ratio: -1,
          description: `商场成本：-${settlementPrice * quantity / 100}元`
        })
        break

      default:
        throw new Error(`不支持的分账模式: ${settlementMode}`)
    }

    return details
  }

  /**
   * 验证结算结果
   * @param result 结算结果
   * @returns 验证是否通过
   */
  validateSettlementResult(result: OrderSettlementResult): boolean {
    const { actualAmount, paymentFee, settlementAmount, merchantAmount, mallAmount } = result

    // 验证金额一致性
    const calculatedSettlementAmount = actualAmount - paymentFee
    if (calculatedSettlementAmount !== settlementAmount) {
      console.error('待结算金额计算错误')
      return false
    }

    // 验证分账金额一致性
    const calculatedTotalSettlement = merchantAmount + mallAmount
    if (Math.abs(calculatedTotalSettlement - settlementAmount) > 1) { // 允许1分的误差
      console.error('分账金额总和与待结算金额不一致')
      return false
    }

    return true
  }

  /**
   * 格式化金额显示
   * @param amount 金额（分）
   * @returns 格式化后的金额字符串
   */
  formatAmount(amount: number): string {
    return (amount / 100).toFixed(2)
  }

  /**
   * 获取结算摘要
   * @param result 结算结果
   * @returns 结算摘要
   */
  getSettlementSummary(result: OrderSettlementResult): string {
    const { actualAmount, paymentFee, settlementAmount, merchantAmount, mallAmount, feeRate } = result
    
    return `
订单结算摘要：
- 订单实收：${this.formatAmount(actualAmount)}元
- 支付手续费：${this.formatAmount(paymentFee)}元（费率：${feeRate}%）
- 待结算金额：${this.formatAmount(settlementAmount)}元
- 商铺分账：${this.formatAmount(merchantAmount)}元
- 商场分账：${this.formatAmount(mallAmount)}元
    `.trim()
  }
}

// 导出单例实例
export const orderSettlementService = new OrderSettlementService()
