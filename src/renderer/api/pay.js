import request from '@/utils/request'
export function AopF2F(data) {
  request.defaults.error = false // 关闭错误提示
  return request({
    method: 'post',
    data: {
      service: 'pay-api',
      method: 'Pays.AopF2F',
      request: {
        order: data
      }
    }
  })
}

export function Refund(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      service: 'pay-api',
      method: 'Pays.Refund',
      request: {
        pay: data
      }
    }
  })
}
