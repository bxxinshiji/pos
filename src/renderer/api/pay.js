import request from '@/utils/request'
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
