import request from '@/utils/request'

export function Login(data) {
  return request({
    url: '/user-api/auth/auth',
    method: 'post',
    data: {
      user: data
    }
  })
}

export function Logout() {
  return request({
    url: '/user-api/auth/logout',
    method: 'post',
    data: {
    }
  })
}
