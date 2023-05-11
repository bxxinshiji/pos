/*
 * @Author: BigRocs
 * @Date: 2022-01-27 10:40:07
 * @LastEditTime: 2023-05-11 14:53:43
 * @LastEditors: BigRocs
 * @Description: QQ: 532388887, Email:bigrocs@qq.com
 */

/**
 * pay.js 支付类
 */
const events = require('events')
import config from './config.js'

class Pay {
  constructor() {
    this.EventEmitter = new events.EventEmitter()
    this.info = {
      type: 'info',
      message: '等待付款操作'
    }
  }
  SetPool(Pool) {
    this.Pool = Pool // 对象池
    this.Pool.parents = this
    this.info = {
      type: 'info',
      message: '等待付款操作'
    }
  }
  InitEventEmitter() {
    this.EventEmitter = new events.EventEmitter()
  }
  Create(order) { // 创建订单
    return new Promise((resolve, reject) => {
      this.Pool.Create(order).then(response => {
        if (config.CLOSED === response.status) {
          this.InfoEvent('error', '订单已关闭')
        }
        this.ResponseEvent(response)
        resolve(response)
      }).catch(error => {
        this.InfoEvent('error', error.message)
        reject(error)
      })
    })
  }
  Query(order) { // 查询订单
    return new Promise((resolve, reject) => {
      this.Pool.Query(order).then(response => {
        if (config.CLOSED === response.status) {
          this.InfoEvent('error', '订单已关闭')
        }
        this.ResponseEvent(response)
        resolve(response)
      }).catch(error => {
        this.InfoEvent('error', error.message)
        reject(error)
      })
    })
  }
  Cancel(order) { // 取消订单
    if (this.Pool !== undefined) {
      return this.Pool.Cancel(order)
    } else {
      return this.CancelEvent(true)
    }
  }
  Refund(order) { // 订单退款
    return new Promise((resolve, reject) => {
      this.Pool.Refund(order).then(response => {
        if (config.CLOSED === response.status) {
          this.InfoEvent('error', '订单已关闭')
        }
        this.ResponseEvent(response)
        resolve(response)
      }).catch(error => {
        this.InfoEvent('error', error.message)
        reject(error)
      })
    })
  }
  On(event, fun) { // 事件监听
    this.EventEmitter.on(event, fun)
  }
  ResponseEvent(response) { // 成功实践返回数据
    this.EventEmitter.emit('response', response)
  }
  CancelEvent(cancel) { // 取消实践
    this.EventEmitter.emit('cancel', cancel)
  }
  // InfoEvent 信息事件
  InfoEvent(type, message) {
    this.info = {
      type,
      message
    }
    this.EventEmitter.emit('info', type, message)
  }
  // LogEvent 日志时间
  LogEvent(type, scope, message) {
    this.EventEmitter.emit('log', type, scope, message)
  }
}

export default Pay
