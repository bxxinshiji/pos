import request from '@/utils/request'

export function Login(data) {
  request.defaults.error = true // 关闭错误提示
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
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      service: 'user-api',
      method: 'Auth.Logout',
      request: {}
    }
  })
}
