import request from '@/utils/request'
export function AopF2F(data) {
  return request({
    url: '/pay-api/pays/aopF2F',
    method: 'post',
    data: {
      order: data
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
