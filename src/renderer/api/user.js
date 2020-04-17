import request from '@/utils/request'
const SQL2000SQL = import('@/sql2000/model/user')

export function Exist(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/users/exist',
    method: 'post',
    data: data
  })
}

export function List(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/users/list',
    method: 'post',
    data: data
  })
}

export function Info() {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/users/info',
    method: 'post',
    data: {
    }
  })
}

export function Get(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/users/get',
    method: 'post',
    data: data
  })
}

export function Create(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/users/create',
    method: 'post',
    data: data
  })
}

export function Update(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/users/update',
    method: 'post',
    data: data
  })
}

export function Delete(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    url: '/user-api/users/delete',
    method: 'post',
    data: data
  })
}
// Password 密码修改
export function Password(username, password) {
  return new Promise((resolve, reject) => {
    SQL2000SQL.then(sql => {
      sql.default.Password(username, password).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    }).catch(error => {
      reject(error)
    })
  })
}
