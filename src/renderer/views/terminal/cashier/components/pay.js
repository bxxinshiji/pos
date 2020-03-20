import { Notification, Message } from 'element-ui'
import { AopF2F } from '@/api/pay'
import { syncOrder } from '@/api/order'
import { Pay as CardPay, Get as VipCardGet } from '@/api/vip_card'
import { parseTime } from '@/utils/index'
import print from '@/utils/print'
import errorPay from '@/utils/error-pay'

import { findCreate as findCreatePayOrder, StautsUpdate as StautsUpdatePayOrder } from '@/model/api/payOrder'
import { AddPrint } from '@/model/api/order'
import orderSequelize from '@/model/order'
const Order = orderSequelize.models.order

import { v4 as uuidv4 } from 'uuid'

// 完结订单
const EndOrder = (order, self) => {
  Order.create(order, {
    include: [Order.Goods, Order.Pays]
  }).then(orderRes => {
    if (print.switch()) {
      print.hander(orderRes).then(response => {
        AddPrint(orderRes) // 增加打印次数
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
      })
    }
    order.status = true // 订单完结
    self.handleClose() // 关闭页面
    syncOrder(orderRes) // 异步同步服务器订单
  }).catch(error => {
    // 删除出错关联插入订单数据
    Order.destroy({ where: { orderNo: order.orderNo }})
    Notification({
      title: '创建订单错误',
      message: error.message,
      type: 'error',
      duration: 15000
    })
  })
}

const hander = {
  payHander(pay) {
    return new Promise(async(resolve, reject) => {
      if (!pay.status) {
        switch (pay.type) {
          case 'cardPay':
            if (pay.code) {
              await CardPay(pay).then(response => {
                pay.status = true
                resolve(pay)
              }).catch(error => {
                reject(error)
              })
            } else {
              reject(new Error('请刷卡!会员卡号不允许为空'))
            }
            break
          case 'remoteCardPay':
            console.log('remoteCardPay')
            break
          case 'scanPay':
            this.scand = true
            await this.payAopF2F(pay).then(response => {
              pay.status = response
              this.scand = false
              resolve(pay)
            }).catch(error => {
              this.scand = false
              reject(error)
            })
            break
          case 'cashPay':
            pay.status = true // 现金支付时默认支付状态成功
            resolve(pay)
            break
        }
      }
    })
  },
  cardPay(code) {
    VipCardGet(code).then(response => {
      const payAmount = this.payAmount
      if (response.amount * 100 < this.payAmount) {
        this.$store.dispatch('terminal/changePayAmount', response.amount * 100) // 根据会员卡月自定义输收款金额
      }
      if (this.payAmount) {
        this.handerPay(response.id, response.cardNo)
      } else {
        this.$store.dispatch('terminal/changePayAmount', payAmount) // 无法付款时恢复 付款金额
        this.error = '账户余额为零'
      }
    }).catch(error => {
      this.error = error
    })
  },
  payAopF2F(pay) {
    return new Promise(async(resolve, reject) => {
      const code = pay.code
      pay.orderNo = uuidv4().replace(/\-/g, '') // 支付宝、微信等支付指定订单单号[UUID生成]
      let method = ''
      const regAlipay = /^(?:2[5-9]|30)\d{14,18}$/
      if (regAlipay.test(code)) { // 支付宝支付
        method = 'alipay'
      }
      const regWechat = /^1[0-5]\d{16}$/
      if (regWechat.test(code)) { // 微信支付
        method = 'wechat'
      }
      if (method) {
        // 查找创建 PayOrder
        await findCreatePayOrder(this.order, {
          storeId: this.scanStoreId,
          method: method,
          authCode: code,
          title: this.orderTitle,
          orderNo: this.order.orderNo + parseTime(new Date(), '{h}{i}{s}{n}'),
          totalAmount: pay.amount,
          operatorId: this.username,
          terminalId: this.terminal
        }).then(async res => {
          await this.AopF2F(res.pay).then(response => {
            if (response) {
              StautsUpdatePayOrder(res.pay.orderNo, response)
            }
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        }).catch(error => {
          reject(error)
        })
      } else {
        reject(new Error('暂不支持此付款方式!'))
      }
    })
  },
  AopF2F(pay) {
    return new Promise(async(resolve, reject) => {
      await AopF2F(pay).then(response => { // 远程支付开始
        resolve(response.data.valid)
      }).catch(error => {
        const err = errorPay.hander(error, pay.method)
        if (err === 'USERPAYING') {
          this.warning = '等待用户付款中'
          const sleep = 6
          setTimeout(() => { // 等待时间后继续请求支付查询付款情况
            this.warning = '支付查询中'
            this.AopF2F(pay).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          }, (sleep - 1) * 1000)// 等待
        } else {
          reject(err) // 返回处理后的错误信息
        }
      })
    })
  },
  scanPay(code) {
    if (!this.scanStoreId) {
      this.error = '请设置付款商家'
      return
    }
    if (!this.scanPayId) {
      this.error = '扫码付款方式未设置'
      return
    }
    if (this.payAmount < this.order.waitPay) {
      this.error = '扫码付款必须大于待付款金额!【多笔付款请最后支付】'
      return
    }
    this.handerPay(this.scanPayId, code)
  },
  handerPay(id, code = '') { // 根据付款方式ID 整合付款信息
    this.initInfo()
    let payInfo = {}
    this.pays.forEach(pay => {
      if (String(pay.id) === String(id)) {
        if (this.order.type) {
          if (this.order.waitPay > 0) {
            const amount = this.payAmount >= this.order.waitPay ? this.order.waitPay : this.payAmount // 计算付款金额tatus: pay.type === 'cashPay' // 现金支付时默认支付状态成功
            const getAmount = pay.type === 'cashPay' ? (this.payAmount === 0 || amount) : amount // 收到的钱[现金可以多少其他不允许]
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
          if (pay.type === 'cashPay') {
            const amount = this.order.waitPay
            payInfo = {
              payId: pay.id, // 支付方式
              name: pay.name, // 支付方式名称
              type: pay.type, // 支付方式
              code: code, // 会员卡
              amount: amount, // 支付金额
              getAmount: '', // 收到的钱[现金可以多少其他不允许]
              orderNo: '', // 支付宝、微信等支付指定订单单号[UUID生成]
              status: false // 现金支付时默认支付状态成功
            }
          } else {
            this.error = '退货只允许现金形式'
            return
          }
        }
        this.payHander(payInfo).then(response => {
          this.order.pays.push(response)
          this.$store.dispatch('terminal/handerOrder') // 更新订单信息
          this.handerOrder() // 处理订单支付
        }).catch(error => {
          this.error = error
          return
        })
      }
    })
  },
  async handerOrder() {
    if (this.order.waitPay === 0) {
      EndOrder(this.order, this)
    } else {
      this.handleClose() // 关闭页面防止  修改 BUG 多种支付时第二次无法输入需求金额问题【每种支付确认后自动关闭页面】
      Message({
        type: 'waning',
        message: '订单还未完结,请支付剩余货款。金额: ' + (this.order.waitPay / 100).toFixed(2) + ' 元'
      })
    }
  }
}
export default hander
