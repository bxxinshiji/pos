import request from '@/utils/request'
import { List, StautsUpdate as StautsUpdatePayOrder } from '@/model/api/payOrder'
import utilsPay from '@/utils/pay'
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

export function SyncPayOrder() { // 同步所有代付款订单状态
  List({
    where: { stauts: 0 }
  }).then(response => {
    if (response.count > 0) {
      const rows = response.rows
      rows.forEach(order => {
        const pay = order.pay
        Query({
          orderNo: pay.orderNo,
          storeName: pay.storeName
        }).then(response => { // 远程支付查询开始
          utilsPay.hander(response.data, pay.method)
          StautsUpdatePayOrder(pay.orderNo, utilsPay.valid)
        })
      })
    }
  })
}
