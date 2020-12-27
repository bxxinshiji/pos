import request from '@/utils/ipc-request'

export function cashdraw() {
  return request({
    url: '/printer/cashdraw',
    method: 'post'
  })
}

export function print(order, valid = false) {
  return request({
    url: '/printer/print',
    method: 'post',
    data: { order, valid }
  })
}

export function accounts(orderInfo, username, valid) {
  return request({
    url: '/printer/accounts',
    method: 'post',
    data: { orderInfo, username, valid }
  })
}

