import request from '@/utils/request'

export function Pay(data) {
  return request({
    method: 'post',
    data: {
      service: 'pay-api',
      method: 'Pays.Pay',
      request: {
        pay: data
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
