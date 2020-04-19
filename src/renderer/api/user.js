import request from '@/utils/request'
const SQL2000SQL = import('@/sql2000/model/user')

export function Exist(data) {
  return request({
    url: '/user-api/users/exist',
    method: 'post',
    data: data
  })
}

export function List(data) {
  return request({
    url: '/user-api/users/list',
    method: 'post',
    data: data
  })
}

export function Info() {
  return request({
    url: '/user-api/users/info',
    method: 'post',
    data: {
    }
  })
}

export function Get(data) {
  return request({
    url: '/user-api/users/get',
    method: 'post',
    data: data
  })
}

export function Create(data) {
  return request({
    url: '/user-api/users/create',
    method: 'post',
    data: data
  })
}

export function Update(data) {
  return request({
    url: '/user-api/users/update',
    method: 'post',
    data: data
  })
}

export function Delete(data) {
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
