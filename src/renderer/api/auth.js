import request from '@/utils/request'

export function Login(data) {
  return request({
    method: 'post',
    data: {
      service: 'user-api',
      method: 'Auth.Auth',
      request: {
        user: data
      }
    }
  })
}

export function Logout() {
  return request({
    method: 'post',
    data: {
      service: 'user-api',
      method: 'Auth.Logout',
      request: {}
    }
  })
}
