import request from '@/utils/request'
import store from '@/store'
export function AopF2F(data) {
  return new Promise((resolve, reject) => {
    if (store.state.healthy.isServer) {
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
    } else {
      reject(new Error('支付服务器无法链接'))
    }
  })
}
export function Query(data) {
  return new Promise((resolve, reject) => {
    if (store.state.healthy.isServer) {
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
    } else {
      reject(new Error('支付服务器无法链接'))
    }
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
