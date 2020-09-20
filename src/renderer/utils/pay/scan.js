
/**
 * scan.js 扫码支付类
 */
import { AopF2F, Query, OpenRefund } from '@/api/pay'
import { Create as CreatePayOrder } from '@/model/api/payOrder'
import config from './config.js'

class Scan {
  constructor() {
    this.cancel = false
    this.waitCancel = false
    this.startTime = new Date()
  }
  Create(order) { // 创建订单
    return new Promise((resolve, reject) => {
      if (order.method) {
        // 查找创建 PayOrder
        CreatePayOrder(order).then(payModel => {
          this.parents.LogEvent('info', 'CreatePayOrder.then', JSON.stringify(payModel))
          const pay = {
            orderNo: payModel.orderNo,
            method: payModel.method,
            authCode: payModel.authCode,
            title: payModel.title,
            totalAmount: payModel.totalAmount,
            operatorId: payModel.operatorId,
            terminalId: payModel.terminalId,
            storeName: payModel.storeName,
            storeId: payModel.storeId
          }
          this.AopF2F(pay).then(response => {
            this.payModelSave(payModel, response)
            resolve(response)
          }).catch(err => {
            this.cancel = true
            reject(err)
          })
        }).catch(error => {
          this.cancel = true
          this.parents.LogEvent('error', 'Create.findCreatePayOrder.catch', JSON.stringify(error.message))
          this.parents.InfoEvent('error', '创建订单缓存失败请重新扫码!')
        })
      } else {
        this.cancel = true
        this.parents.LogEvent('error', 'Create.order.method', '暂不支持此付款方式 ' + JSON.stringify(order.authCode))
        this.parents.InfoEvent('error', '暂不支持此付款方式!')
      }
    })
  }
  Query(order) { // 查询订单
    return new Promise((resolve, reject) => {
      if (!this.cancel) {
        Query(order).then(response => {
          this.parents.LogEvent('info', 'scan.Query', JSON.stringify(order) + '\n' + JSON.stringify(response))
          this.handerAopF2FResponse(response, order).then(res => {
            resolve(res)
          }).catch(err => {
            reject(err)
          })
        }).catch(async error => {
          this.parents.LogEvent('error', 'Scan.Query.Query.catch', JSON.stringify(error.message))
          if (this.waitCancel) { // 从关闭等待状态进入关闭状态
            this.cancel = true
            this.parents.CancelEvent(true)
            reject(error)
          }
          if (error.message.indexOf('timeout of') !== -1) {
            this.parents.InfoEvent('warning', '查询超时,等待中。')
          }
          await this.Sleep()// 等待
          this.parents.InfoEvent('warning', '查询错误再次支付查询中')
          this.Query(order).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      } else {
        reject(new Error('支付已取消'))
      }
    })
  }
  Cancel(order) { // 取消订单
    return new Promise((resolve, reject) => {
      if (this.cancel) {
        this.parents.CancelEvent(true)
      }
      const down = 20 * 1000 - (new Date() - this.startTime) // 开始支付20秒后可以关闭支付页面
      setTimeout(() => {
        this.waitCancel = true
        this.parents.InfoEvent('off', '关闭支付中...')
      }, down)
      this.parents.InfoEvent('waitClose', '开始关闭支付请稍等...')
      this.parents.LogEvent('info', 'Scan.Query.Cancel', 'waitCancel')
    })
  }
  async payModelSave(payModel, response) { // 支付数据保存
    payModel.stauts = response
    payModel.save().then(res => { // 二次保存防止一次保存没有成功
      this.parents.LogEvent('info', 'payModel.save.then', JSON.stringify(res))
    }).catch(error => {
      this.parents.LogEvent('error', 'payModel.save.error', JSON.stringify(error.message))
    })
  }
  Refund(order) { // 创建订单
    return new Promise((resolve, reject) => {
      const originalOrderNo = order.orderNo
      order.orderNo = order.orderNo + '_T'
      order.originalOrderNo = originalOrderNo
      // 查找创建 PayOrder
      CreatePayOrder(order).then(payModel => {
        this.parents.LogEvent('info', 'CreatePayOrder.then', JSON.stringify(payModel))
        const pay = {
          orderNo: payModel.orderNo,
          originalOrderNo: originalOrderNo, // 退款订单新编号
          totalAmount: Math.abs(payModel.totalAmount),
          storeName: payModel.storeName,
          storeId: payModel.storeId
        }

        order.totalAmount = Math.abs(order.totalAmount)
        this.AopF2FRefund(pay).then(response => {
          this.payModelSave(payModel, response)
          resolve(response)
        }).catch(err => {
          this.cancel = true
          reject(err)
        })
      }).catch(error => {
        this.cancel = true
        this.parents.LogEvent('error', 'Refund.findCreatePayOrder.catch', JSON.stringify(error.message))
        this.parents.InfoEvent('error', '创建退款订单缓存失败请重新扫码!')
      })
    })
  }
  AopF2FRefund(order) { // 订单退款
    return new Promise((resolve, reject) => {
      if (!this.cancel) {
        this.parents.InfoEvent('warning', '扫码支付退款中')
        OpenRefund(order).then(response => { // 远程支付开始
          this.parents.LogEvent('info', 'Scan.Refund.OpenRefund.then', JSON.stringify(order) + '\n' + JSON.stringify(response))
          this.parents.InfoEvent('warning', '退款申请成功等待确认中')
          this.Query(order).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        }).catch(async error => {
          this.parents.LogEvent('error', 'Scan.Refund.OpenRefund.catch', JSON.stringify(error.message))
          if ((error.message.indexOf('Network Error') !== -1 || error.message.indexOf('timeout of') !== -1)) { // 下单超时并且在付款状态中、非付款状态自动进入查询
            if (this.waitCancel) { // 从关闭等待状态进入关闭状态
              this.cancel = true
              this.parents.CancelEvent(true)
              reject(error)
            }
            this.parents.InfoEvent('warning', '退款申请服务器超时, 等待重试。')
            await this.Sleep()// 等待
            this.parents.InfoEvent('warning', '重新申请退款中')
            this.AopF2FRefund(order).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          } else {
            this.parents.InfoEvent('warning', '申请退款错误退款查询中')
            this.Query(order).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          }
        })
      } else {
        reject(new Error('退款操作已取消'))
      }
    })
  }
  AopF2F(order) { // 创建订单
    return new Promise((resolve, reject) => {
      if (!this.cancel) {
        this.parents.InfoEvent('warning', '扫码支付下单中')
        AopF2F(order).then(response => { // 远程支付开始
          this.parents.LogEvent('info', 'Scan.Create.AopF2F.then', JSON.stringify(order) + '\n' + JSON.stringify(response))
          this.parents.InfoEvent('warning', '下单成功查询中')
          this.Query(order).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        }).catch(async error => {
          this.parents.LogEvent('error', 'Scan.Create.AopF2F.catch', JSON.stringify(error.message))
          if ((error.message.indexOf('Network Error') !== -1 || error.message.indexOf('timeout of') !== -1)) { // 下单超时并且在付款状态中、非付款状态自动进入查询
            if (this.waitCancel) { // 从关闭等待状态进入关闭状态
              this.cancel = true
              this.parents.CancelEvent(true)
              reject(error)
            }
            this.parents.InfoEvent('warning', '服务器超时, 等待重试。')
            await this.Sleep()// 等待
            this.parents.InfoEvent('warning', '重新下单中')
            this.AopF2F(order).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          } else {
            this.parents.InfoEvent('warning', '下单错误支付查询中')
            this.Query(order).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          }
        })
      } else {
        reject(new Error('支付已取消'))
      }
    })
  }
  handerAopF2FResponse(response, order) {
    return new Promise(async(resolve, reject) => {
      const data = response.data
      switch (data.order.stauts) {
        case 'CLOSED':
          this.cancel = true
          resolve(config.CLOSED)
          break
        case 'USERPAYING':
          if (this.waitCancel) { // 从关闭等待状态进入关闭状态
            this.cancel = true
            this.parents.CancelEvent(true)
          }
          if (order.originalOrderNo) {
            this.parents.InfoEvent('warning', '等待管理员确认退款')
            await this.Sleep()// 等待
            this.parents.InfoEvent('warning', '退款查询中')
          } else {
            this.parents.InfoEvent('warning', '等待用户付款中')
            await this.Sleep()// 等待
            this.parents.InfoEvent('warning', '支付查询中')
          }
          this.Query(order).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
          break
        case 'SUCCESS':
          resolve(config.SUCCESS)
          break
      }
    })
  }
  // Sleep 自定义异步等待函数
  Sleep() {
    return new Promise((resolve) => setTimeout(resolve, config.SLEEP * 1000))
  }
}

export default Scan
