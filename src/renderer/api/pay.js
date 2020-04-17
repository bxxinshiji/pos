import request from '@/utils/request'
export function AopF2F(data) {
  request.defaults.error = false // 关闭错误提示
  return request({
    url: '/pay-api/pays/aopF2F',
    method: 'post',
    data: {
      order: data
    }
  })
}

export function Refund(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/pay-api/pays/refund',
    method: 'post',
    data: {
      pay: data
    }
  })
}
