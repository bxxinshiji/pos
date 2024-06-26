
/**
 * Cash.js 现金支付类
 */
import config from './config.js'

class Cash {
  Create(order) { // 创建订单
    return new Promise((resolve, reject) => {
      resolve({ status: config.SUCCESS, payId: 0 })
    })
  }
  Query(order) { // 查询订单
    return new Promise((resolve, reject) => {
      resolve({ status: config.SUCCESS, payId: 0 })
    })
  }
  Cancel(order) { // 取消订单
    return new Promise((resolve, reject) => {
      this.parents.CancelEvent(true)
    })
  }
  Refund(order) { // 订单退款
    return new Promise((resolve, reject) => {
      resolve({ status: config.SUCCESS, payId: 0 })
    })
  }
}

export default Cash
