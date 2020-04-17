import request from '@/utils/request'

export function Login(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/auth/auth',
    method: 'post',
    data: {
      user: data
    }
  })
}

export function Logout() {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/auth/logout',
    method: 'post',
    data: {
    }
  })
}
