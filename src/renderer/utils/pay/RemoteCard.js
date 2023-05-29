/*
 * @Author: BigRocs
 * @Date: 2022-01-27 10:40:07
 * @LastEditTime: 2023-05-11 14:53:26
 * @LastEditors: BigRocs
 * @Description: QQ: 532388887, Email:bigrocs@qq.com
 */

/**
 * RemoteCard.js 远程会员卡
 */
import config from './config.js'

class RemoteCard {
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

export default RemoteCard
