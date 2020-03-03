import request from '@/utils/request'

export function Exist(data) {
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
  return request({
    method: 'post',
    data: {
      'service': 'user-api',
      'method': 'Users.Delete',
      'request': data
    }
  })
}
