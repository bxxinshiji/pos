import store from '@/store'
import { Notification, MessageBox, Message } from 'element-ui'
import { syncOrder } from '@/api/order'
import { UpdateBuildOrderNo } from '@/model/api/payOrder'
import { Pay as CardPay, Get as VipCardGet } from '@/api/vip_card'
import { parseTime } from '@/utils/index'
import print from '@/utils/print'
import escpos from '@/utils/escpos'
import log from '@/utils/log'

import { AddPrint } from '@/model/api/order'
import { Create as OrderCreate } from '@/model/api/order'

// 支付模块
import config from '@/utils/pay/config' // 现金支付模块
import Scan from '@/utils/pay/scan' // 扫码支付模块
import Cash from '@/utils/pay/cash' // 现金支付模块
import Card from '@/utils/pay/card' // 会员卡支付模块
import RemoteCard from '@/utils/pay/RemoteCard' // 远程会员卡支付模块

const hander = {
  payModelHander(pay) {
    this.model.InitEventEmitter() // 初始化事件监听防止重复监听
    this.model.On('response', async res => { // 支付状态返回信息
      if (res === config.SUCCESS) { // 支付成功
        pay.status = true
        if (pay.type === 'cardPay' || pay.type === 'remoteCardPay') { // 会员卡付款时支付状态改为未付款
          pay.status = false
        }
        this.order.pays.push(pay) // 增加支付方式
        this.$store.dispatch('terminal/handerOrder') // 更新订单信息
        this.payingInfo = '支付成功订单处理中'
        this.handerOrder() // 处理订单支付
      }
      this.lock = false
      log.h('info', 'pay.model.response', JSON.stringify(res))
    })
    this.model.On('info', (type, message) => { // 支付信息
      switch (type) {
        case 'waitClose':
          this.status = type
          this.info = message
          break
        case 'off':
          this.status = type
          this.info = message
          break
        case 'error':
          this.lock = false
          this.status = type
          this.payingInfo = message
          break
        default:
          this.status = type
          this.payingInfo = message
          break
      }
    })
    this.model.On('log', (type, scope, message) => { // 日志信息
      log.h(type, scope, message)
    })
    switch (pay.type) {
      case 'cardPay':
        this.model.SetPool(new Card()) // 设置会员卡对象池 // 无操作以实际结算订单操作为准
        this.model.Create(pay)
        break
      case 'remoteCardPay':
        this.model.SetPool(new RemoteCard()) // 设置会员卡对象池 // 无操作以实际结算订单操作为准
        this.model.Create(pay)
        break
      case 'scanPay':
        this.model.SetPool(new Scan()) // 设置扫码对象池
        this.payAopF2F(pay)
        break
      case 'cashPay':
        this.model.SetPool(new Cash()) // 设置现金对象池
        this.model.Create(pay)
        break
    }
  },
  payModelRefundHander(pay, index) {
    return new Promise((resolve, reject) => {
      this.model.InitEventEmitter() // 初始化事件监听防止重复监听
      this.model.On('response', res => { // 支付状态返回信息
        if (res === config.SUCCESS) { // 支付成功
          if (pay.type === 'scanPay') {
            pay.getAmount = pay.amount
          } else {
            pay.getAmount = this.payAmount // 默认收到的钱
          }
          store.dispatch('terminal/changePayAmount', 0) // 防止多笔现金重复
          pay.status = true
          resolve(true)
        } else {
          reject(res)
        }
        log.h('info', 'payModelRefundHander', JSON.stringify(res))
      })
      this.model.On('info', (type, message) => { // 支付信息
        switch (type) {
          case 'waitClose':
            this.status = type
            this.info = message
            break
          case 'off':
            this.status = type
            this.info = message
            break
          case 'error':
            this.lock = false
            this.status = type
            this.payingInfo = message
            break
          default:
            this.status = type
            this.payingInfo = message
            break
        }
      })
      this.model.On('log', (type, scope, message) => { // 日志信息
        log.h(type, scope, message)
      })
      switch (pay.type) {
        case 'cardPay':
          this.model.SetPool(new Card()) // 设置会员卡对象池 // 无操作以实际结算订单操作为准
          this.model.Refund(pay)
          break
        case 'remoteCardPay':
          this.model.SetPool(new Card()) // 设置会员卡对象池 // 无操作以实际结算订单操作为准
          this.model.Refund(pay)
          break
        case 'scanPay':
          this.model.SetPool(new Scan()) // 设置扫码对象池
          this.model.Refund({ // 创建扫码支付订单
            orderNo: this.order.orderNo + '_' + index,
            originalOrderNo: pay.orderNo,
            method: '',
            authCode: pay.code,
            title: '[退款]' + this.orderTitle,
            totalAmount: pay.amount,
            operatorId: this.username,
            terminalId: this.terminal,
            storeName: this.scanStoreName,
            stauts: config.USERPAYING,
            order: this.order
          })
          break
        case 'cashPay':
          this.model.SetPool(new Cash()) // 设置现金对象池
          this.model.Refund(pay)
          break
      }
    })
  },
  cardPay(code) {
    const getVipAmount = (pays, cardNo) => { // 查询次会员卡已付款多少钱
      let amount = 0
      pays.forEach(pay => {
        if (pay.code === cardNo) {
          amount += pay.amount
        }
      })
      return parseInt(amount)
    }
    VipCardGet(code).then(res => {
      log.h('info', 'cardPay.VipCardGet.then', JSON.stringify(res))
      const amount = Math.round(res.amount * 100) // 会员实际余额
      const payAmount = parseInt(this.payAmount)
      const beforeAmount = getVipAmount(this.order.pays, res.cardNo) // 之前已缓存付款金额
      const vipAmount = parseInt(amount - beforeAmount) // 付款后余额
      if (vipAmount < this.payAmount) {
        this.$store.dispatch('terminal/changePayAmount', vipAmount) // 根据会员卡余额自定义输收款金额
      }
      if (this.payAmount) {
        const afterAmount = parseInt(amount - beforeAmount - this.payAmount) // 付款后余额
        this.$confirm( // 会员卡支付信息确认
          '<p>会员卡余额: <b style="color:#67C23A">' + (amount / 100).toFixed(2) + ' 元</b></p>' +
          '<p>会员卡编码: <b>' + res.cardNo + '</b></p>' +
          '<p>会员卡名称: <b>' + res.name + '</b></p>' +
          '<p>支付后余额: <b style="color:#F56C6C">' + (afterAmount / 100).toFixed(2) + ' 元</b></p>' +
          '<p>本笔支付: <b style="color:#E6A23C">' + ((beforeAmount + this.payAmount) / 100).toFixed(2) + ' 元</b></p>' +
          '<p>本次支付: <b style="color:#409EFF">' + (this.payAmount / 100).toFixed(2) + ' 元</b></p>'
          , '会员卡支付信息', {
            type: 'success',
            dangerouslyUseHTMLString: true
          }).then(() => {
          this.handerPay(res.id, res.cardNo)
        }).catch(() => {
          this.lock = false // 接触锁定
          this.$message({
            type: 'warning',
            message: '会员卡支付已取消'
          })
        })
      } else {
        this.lock = false // 接触锁定
        this.$store.dispatch('terminal/changePayAmount', payAmount) // 无法付款时恢复 付款金额
        this.status = 'error'
        this.payingInfo = '账户余额为零'
      }
    }).catch(error => {
      log.h('error', 'cardPay.VipCardGet.error', JSON.stringify(code) + JSON.stringify(error.message))
      this.lock = false // 接触锁定
      this.status = 'error'
      this.payingInfo = error
    })
  },
  handerPays(pays) { // 处理未支付订单
    return new Promise(async(resolve, reject) => {
      for (let index = 0; index < pays.length; index++) {
        const pay = pays[index]
        if (this.order.type) { // 销货
          // 销货状态
          if ((pay.type === 'cardPay' && !pay.status) || pay.type === 'remoteCardPay' && !pay.status) { // 处理会员卡未支付订单
            if (pay.code) {
              await CardPay(pay.code, (pay.amount / 100).toFixed(2)).then(response => {
                pay.status = true
              }).catch(error => {
                reject(error)
              })
            } else {
              reject(new Error('订单结算失败,会员卡号为空!'))
            }
          }
          if (!pay.status) {
            reject(new Error('支付方式: ' + pay.name + ' 未支付'))
          }
        } else { // 退货
          await this.payModelRefundHander(pay, index).then(response => {
          }).catch(error => {
            reject(error)
          })
        }
      }
      resolve(pays)
    })
  },
  payAopF2F(pay) {
    return new Promise((resolve, reject) => {
      const code = pay.code
      // pay.orderNo = uuidv4().replace(/\-/g, '') // 支付宝、微信等支付指定订单单号[UUID生成]
      pay.orderNo = this.order.orderNo + parseTime(new Date(), '{h}{i}{s}{n}')
      this.method = ''
      const regAlipay = /^(?:2[5-9]|30)\d{14,18}$/
      if (regAlipay.test(code)) { // 支付宝支付
        this.method = 'alipay'
      }
      const regWechat = /^1[0-5]\d{16}$/
      if (regWechat.test(code)) { // 微信支付
        this.method = 'wechat'
      }
      this.model.Create({ // 创建扫码支付订单
        orderNo: pay.orderNo,
        method: this.method,
        authCode: pay.code,
        title: this.orderTitle,
        totalAmount: pay.amount,
        operatorId: this.username,
        terminalId: this.terminal,
        storeName: this.scanStoreName,
        stauts: config.USERPAYING,
        order: this.order
      })
    })
  },
  scanPay(code) {
    if (!this.scanStoreName) {
      this.status = 'error'
      this.payingInfo = '请设置付款商家'
      this.lock = false
      return
    }
    if (!this.scanPayId) {
      this.status = 'error'
      this.payingInfo = '扫码付款方式未设置'
      this.lock = false
      return
    }
    this.handerPay(this.scanPayId, code)
  },
  handerPay(id, code = '') { // 根据付款方式ID 整合付款信息
    try {
      this.initInfo()
      log.h('info', 'handerPay.initInfo', JSON.stringify(id)) // debug 可注释
      let payInfo = {}
      this.pays.forEach(pay => {
        if (String(pay.id) === String(id)) { // 获取使用的支付方式信息
          const amount = this.payAmount >= this.order.waitPay ? this.order.waitPay : this.payAmount // 计算付款金额tatus: pay.type === 'cashPay' // 现金支付时默认支付状态成功
          const getAmount = this.payAmount // 默认收到的钱
          if (this.order.type) {
            if (this.order.waitPay > 0) {
              payInfo = {
                payId: pay.id, // 支付方式
                name: pay.name, // 支付方式名称
                type: pay.type, // 支付方式
                code: code, // 会员卡
                amount: amount, // 支付金额
                getAmount: getAmount, // 收到的钱[现金可以多少其他不允许]
                orderNo: '', // 支付宝、微信等支付指定订单单号[UUID生成]
                status: false // 现金支付时默认支付状态成功
              }
            }
          } else { // 退款形式
            if (this.order.waitPay === 0) {
              this.status = 'error'
              this.payingInfo = '可退款金额为0'
              return
            }
            if (pay.type === 'cashPay') {
              payInfo = {
                payId: pay.id, // 支付方式
                name: pay.name, // 支付方式名称
                type: pay.type, // 支付方式
                code: code, // 会员卡
                amount: amount, // 支付金额
                getAmount: getAmount, // 收到的钱[现金可以多少其他不允许]
                orderNo: '', // 支付宝、微信等支付指定订单单号[UUID生成]
                status: false // 现金支付时默认支付状态成功
              }
            } else {
              this.status = 'error'
              this.payingInfo = '手动退货只允许现金形式'
              return
            }
          }
          if (pay.type !== 'scanPay') { // 设置付款方式
            this.method = pay.type
          }
          if (!payInfo.hasOwnProperty('payId')) {
            this.status = 'error'
            this.payingInfo = '付款信息处理错误,请关闭重试!'
            return
          }
          log.h('info', 'handerPay.payInfo', JSON.stringify(payInfo))
          this.payModelHander(payInfo) // 开始支持处理
        }
      })
    } catch (error) {
      this.lock = false
      log.h('error', 'handerPay.error', JSON.stringify(error.message))
      MessageBox.confirm('请安ESC关闭重试' + error.message, '未知错误', {
        type: 'error',
        showCancelButton: false,
        showConfirmButton: false,
        center: true
      }).then(() => {
      }).catch(() => {
      })
    }
  },
  EventOn() {
    this.EventEmitter.on('OrderSaveSuccess', async order => { // 开钱箱
      order.pays.forEach(pay => { // 钱箱控制
        if (pay.name === '现金') {
          escpos.cashdraw().then(() => {
            Message({
              type: 'success',
              message: '打开钱箱成功'
            })
          }).catch(err => {
            log.h('error', 'OrderSaveSuccess.cashdraw', JSON.stringify(err.message))
          })
        }
      })
    })
    this.EventEmitter.on('OrderSaveSuccess', async order => { // 打印机
      this.payingInfo = '订单发布打印中'
      if (print.switch()) {
        print.hander(order).then(response => {
          AddPrint(order) // 增加打印次数
          this.payingInfo = '订单发布打印成功'
          Notification({
            title: '打印成功',
            message: '订单:' + order.orderNo,
            type: 'success'
          })
        }).catch(err => {
          Notification({
            title: '打印失败',
            message: err.message,
            type: 'error',
            duration: 15000
          })
          log.h('error', 'OrderSaveSuccess.print.hander', JSON.stringify(err.message))
        })
      }
    })
    this.EventEmitter.on('OrderSaveSuccess', async order => { // 扫码支付绑定订单
      order.pays.forEach(pay => {
        if (pay.type === 'scanPay') {
          UpdateBuildOrderNo(pay.orderNo, order.orderNo).catch(error => {
            log.h('error', 'UpdateBuildOrderNo', JSON.stringify(error.message))
          }) // 支付订单绑定订单ID
        }
      })
    })
    this.EventEmitter.on('OrderSaveSuccess', async order => { // 同步订单
      this.payingInfo = '订单发布中'
      syncOrder(order).then(res => { // 同步订单信息
        order.publish = true
        order.save().then(() => {
          this.payingInfo = '订单发布中成功'
          store.dispatch('terminal/changeOrderInfo') // 更新订单汇总信息
        }).catch(error => { // 进行二次保存防止第一次创建没有保存
          log.h('error', 'syncOrder.orderRes.save', JSON.stringify(error.message) + '\n' + JSON.stringify(order))
        }) // 异步同步服务器订单
        log.h('info', 'syncOrder.then', JSON.stringify(res))
      })// 异步同步服务器订单
    })
  },
  OrderSave() {
    this.payingInfo = '订单保存中'
    OrderCreate(this.order).then(order => {
      this.order.status = true // 订单完结
      this.payingInfo = '订单保存成功'
      store.dispatch('terminal/changeOrderInfo') // 更新订单汇总信息
      this.EventEmitter.emit('OrderSaveSuccess', order)
      this.handleClose() // 关闭页面
      log.h('info', 'EndOrder.then', JSON.stringify(order))
    }).catch(error => {
      // 删除出错关联插入订单数据
      // Order.destroy({ where: { orderNo: order.orderNo }}).catch(error => {
      //   log.h('error', 'EndOrder.error.destroy', JSON.stringify(error.message))
      // })
      MessageBox.confirm('请重新合计。' + error.message, '创建订单错误', {
        type: 'error',
        showCancelButton: false,
        showConfirmButton: false,
        center: true
      }).then(() => {
      }).catch(() => {
      })
      log.h('error', 'EndOrder.error', JSON.stringify(error.message) + '\n' + JSON.stringify(this.order))
    })
  },
  handerOrder() {
    if (this.order.waitPay === 0) {
      this.lock = true
      this.status = 'warning'
      this.info = '订单处理中'
      this.handerPays(this.order.pays).then(() => { // 处理订单未支付
        this.OrderSave()
      }).catch(error => {
        log.h('error', 'handerPays.error', JSON.stringify(error.message))
        MessageBox.confirm(error.message, '支付处理失败', {
          type: 'error',
          showCancelButton: false,
          showConfirmButton: false,
          center: true
        }).then(() => {
        }).catch(() => {
        })
      })
    } else {
      this.handleClose() // 关闭页面防止  修改 BUG 多种支付时第二次无法输入需求金额问题【每种支付确认后自动关闭页面】
      Message({
        type: 'warning',
        message: '订单还未完结,请支付剩余货款。金额: ' + (this.order.waitPay / 100).toFixed(2) + ' 元'
      })
    }
  }
}
export default hander
