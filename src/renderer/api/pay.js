import request from '@/utils/request'
request.defaults.error = false // 关闭错误提示
export function AopF2F(data) {
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
