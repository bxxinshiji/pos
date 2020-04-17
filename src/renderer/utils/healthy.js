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
  var status = false
  await request({
    url: '/user-api/health/health',
    method: 'post',
    data: {
    }
  }).then(() => {
    status = true
  }).catch(() => {
    status = false
  })
  return status
}
