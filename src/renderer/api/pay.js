import request from '@/utils/request'
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

export function SyncPayOrder() { // 同步所有代付款订单状态
  List({
    where: { stauts: 0 }
  }).then(response => {
    if (response.count > 0) {
      const rows = response.rows
      rows.forEach(res => {
        const pay = {
          orderNo: res.orderNo,
          method: res.method,
          authCode: res.authCode,
          title: res.title,
          totalAmount: res.totalAmount,
          operatorId: res.operatorId,
          terminalId: this.terminal,
          storeName: res.storeName,
          storeId: res.storeId
        }
        Query({
          orderNo: pay.orderNo,
          storeName: pay.storeName
        }).then(response => { // 远程支付查询开始
          const data = response.data
          switch (data.order.stauts) {
            case 'CLOSED':
              StautsUpdatePayOrder(pay.orderNo, -1)
              break
            case 'USERPAYING':
              break
            case 'SUCCESS':
              StautsUpdatePayOrder(pay.orderNo, 1)
              break
          }
        })
      })
    }
  })
}
