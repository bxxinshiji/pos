import request from '@/utils/request'
const ping = require('ping')
/**
 * navigator 设备情况
 */
/**
 * onLine 路由器状态
 * @returns {bool}
 */
export function onLine() {
  return navigator.onLine
}
/**
 * isInternet 互联网状态
 * @returns {bool}
 */
export async function isInternet() {
  let status = false
  await ping.promise.probe('114.114.114.114').then(() => {
    status = true
  }).catch(() => {
    status = false
  })
  return status
}

/**
 * isServer 服务器状态
 * @returns {Promise}
 */
export async function isServer(url = null) {
  url ? (request.defaults.baseURL = url) : null
  request.defaults.error = false // 关闭错误提示
  var status = false
  await request({
    method: 'post',
    data: {
      service: 'user-api',
      method: 'Health.Health',
      request: {}
    }
  }).then(() => {
    status = true
  }).catch(() => {
    status = false
  })
  request.defaults.error = true // 开启错误提示
  return status
}
