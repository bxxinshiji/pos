
/**
 * Card.js 会员卡
 */
import config from './config.js'

class Card {
  Create(order) { // 创建订单
    return new Promise((resolve, reject) => {
      resolve(config.SUCCESS)
    })
  }
  Query(order) { // 查询订单
    return new Promise((resolve, reject) => {
      resolve(config.SUCCESS)
    })
  }
  Cancel(order) { // 取消订单
    return new Promise((resolve, reject) => {
      this.parents.CancelEvent(true)
    })
  }
}

export default Card
