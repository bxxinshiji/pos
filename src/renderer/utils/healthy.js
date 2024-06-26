/*
 * @Author: BigRocs
 * @Date: 2022-01-27 10:40:07
 * @LastEditTime: 2024-04-27 10:37:08
 * @LastEditors: BigRocs
 * @Description: QQ: 532388887, Email:bigrocs@qq.com
 */
// import request from '@/utils/request'
import { Loading } from 'element-ui'
import { parseTime } from '@/utils'
// import PayBcbtStore from '@/utils/pay-bcbt-electron-store'
const ping = require('ping')

// const ApiUrl = PayBcbtStore.get('pay.api')
var loadingInstance
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
export async function syncDateTime(dateTime) { // 同步系统时间
  if (Math.abs(dateTime - new Date()) > 2 * 60 * 60 * 1000) { // 时差大于5分钟时自动校对系统时间
    loadingInstance = Loading.service({
      text: '系统时间差过大,时间同步中请等待...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    switch (process.platform) {
      case 'win32':
        require('child_process').exec('date ' + parseTime(dateTime, '{y}-{m}-{d}'))
        require('child_process').exec('time ' + parseTime(dateTime, '{h}:{i}:{s}'))
        break
      // case 'darwin':
        // 修改是需要密码所以无法修改系统时间
        // require('child_process').exec('sudo date ' + parseTime(dateTime, '{m}{d}{h}{i}{y}'))
        // break
      default:
        console.log('暂时只支持win系统同步时间')
        break
    }
  } else {
    if (loadingInstance) {
      loadingInstance.close()
    }
  }
}
/**
 * isServer 服务器状态
 * @returns {Promise}
 */
export async function isServer(url = null) {
  // url ? (request.defaults.baseURL = url) : null
  // var status = false
  // await request({
  //   url: ApiUrl + '/user-api/health/health',
  //   method: 'post',
  //   data: {
  //   }
  // }).then(res => {
  //   status = res.data.valid
  // }).catch(() => {
  //   status = false
  // })
  // return status
}
