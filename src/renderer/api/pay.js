import request from '@/utils/request'
const { Op } = require('sequelize')
import { List, StautsUpdate as StautsUpdatePayOrder } from '@/model/api/payOrder'

export function AopF2F(data) {
  return new Promise((resolve, reject) => {
    request({
      url: '/pay-api/pays/aopF2F',
      method: 'post',
      data: {
        order: data
      }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
export function Query(data) {
  return new Promise((resolve, reject) => {
    request({
      url: '/pay-api/pays/query',
      method: 'post',
      data: {
        order: data
      }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function Refund(data) {
  return request({
    url: '/pay-api/pays/refund',
    method: 'post',
    data: {
      pay: data
    }
  })
}

export function SyncPayOrder() { // 同步所有待付款订单状态
  List({
    where: {
      [Op.or]: [
        {
          stauts: 0
        }, { // 自动同步最近5分钟内未成功的订单
          stauts: { [Op.ne]: 1 },
          createdAt: { [Op.gt]: new Date(new Date() - 5 * 60 * 1000)
          }
        }]
    }
  }).then(response => {
    if (response.count > 0) {
      const rows = response.rows
      rows.forEach(res => {
        Query({
          orderNo: res.orderNo,
          storeName: res.storeName
        }).then(response => { // 远程支付查询开始
          const data = response.data
          switch (data.order.stauts) {
            case 'CLOSED':
              StautsUpdatePayOrder(res.orderNo, -1)
              break
            case 'USERPAYING':
              break
            case 'SUCCESS':
              StautsUpdatePayOrder(res.orderNo, 1)
              break
          }
        })
      })
    }
  })
}
