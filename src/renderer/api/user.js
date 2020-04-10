import request from '@/utils/request'
const SQL2000SQL = import('@/sql2000/model/user')

export function Exist(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      'service': 'user-api',
      'method': 'Users.Exist',
      'request': data
    }
  })
}

export function List(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      'service': 'user-api',
      'method': 'Users.List',
      'request': data
    }
  })
}

export function Info() {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      service: 'user-api',
      method: 'Users.Info',
      request: {}
    }
  })
}

export function Get(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      'service': 'user-api',
      'method': 'Users.Get',
      'request': data
    }
  })
}

export function Create(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      'service': 'user-api',
      'method': 'Users.Create',
      'request': data
    }
  })
}

export function Update(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      'service': 'user-api',
      'method': 'Users.Update',
      'request': data
    }
  })
}

export function Delete(data) {
  request.defaults.error = true // 关闭错误提示
  return request({
    method: 'post',
    data: {
      'service': 'user-api',
      'method': 'Users.Delete',
      'request': data
    }
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
