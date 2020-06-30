import store from '@/store'
import { Notification, MessageBox, Message } from 'element-ui'
import { AopF2F, Query } from '@/api/pay'
import { syncOrder } from '@/api/order'
import { UpdateBuildOrderNo } from '@/model/api/payOrder'
import { Pay as CardPay, Get as VipCardGet } from '@/api/vip_card'
import { parseTime } from '@/utils/index'
import { Sleep } from '@/utils'
import print from '@/utils/print'
import escpos from '@/utils/escpos'
import log from '@/utils/log'

import { Create as CreatePayOrder } from '@/model/api/payOrder'
import { AddPrint } from '@/model/api/order'
import orderSequelize from '@/model/order'
const Order = orderSequelize.models.order

const CLOSED = -1
const USERPAYING = 0
const SUCCESS = 1

// 完结订单
const EndOrder = (order, self) => {
  Order.create(order, {
    include: [Order.Goods, Order.Pays]
  }).then(orderRes => {
    log.scope('EndOrder.then').info(JSON.stringify(order))
    const handler = async() => {
      order.pays.forEach(pay => { // 钱箱控制
        if (pay.name === '现金') {
          escpos.cashdraw().then(() => {
            Message({
              type: 'success',
              message: '打开钱箱成功'
            })
          })
        }
      })
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
      orderRes.pays.forEach(pay => {
        if (pay.type === 'scanPay') {
          UpdateBuildOrderNo(pay.orderNo, orderRes.orderNo).catch(error => {
            log.scope('UpdateBuildOrderNo').error(JSON.stringify(error.message))
          }) // 异步同步服务器订单
        }
      })
      store.dispatch('terminal/changeOrderInfo') // 更新订单汇总信息
      syncOrder(orderRes).then(res => { // 同步订单信息
        orderRes.publish = true
        orderRes.save().catch(error => { // 进行二次保存防止第一次创建没有保存
          log.scope('syncOrder.orderRes.save').error(JSON.stringify(error.message) + '\n' + JSON.stringify(orderRes))
        }) // 异步同步服务器订单
        store.dispatch('terminal/changeOrderInfo') // 更新订单汇总信息
        log.scope('syncOrder.then').info(JSON.stringify(res))
      }) // 异步同步服务器订单
    }
    handler()
    order.status = true // 订单完结
    self.handleClose() // 关闭页面
  }).catch(error => {
    log.scope('EndOrder.error').error(JSON.stringify(error.message) + '\n' + JSON.stringify(order))
    // 删除出错关联插入订单数据
    Order.destroy({ where: { orderNo: order.orderNo }}).catch(error => {
      log.scope('EndOrder.error.destroy').error(JSON.stringify(error.message))
    })
    MessageBox.confirm('请重新合计。' + error.message, '创建订单错误', {
      type: 'error',
      showCancelButton: false,
      showConfirmButton: false,
      center: true
    }).then(() => {
    }).catch(() => {
    })
  })
}
const hander = {
  payHander(pay) {
    return new Promise(async(resolve, reject) => {
      if (!pay.status) {
        switch (pay.type) {
          case 'cardPay':
            // if (pay.code) {
            //   await CardPay(pay.code, (pay.amount / 100).toFixed(2)).then(response => {
            //     pay.status = true
            //     resolve(pay)
            //   }).catch(error => {
            //     reject(error)
            //   })
            // } else {
            //   reject(new Error('请刷卡!会员卡号不允许为空'))
            // }
            resolve(pay)
            break
          case 'remoteCardPay':
            console.log('remoteCardPay')
            break
          case 'scanPay':
            await this.payAopF2F(pay).then(response => {
              pay.status = response || false
              Notification({
                title: '支付成功',
                message: '订单金额: ' + (pay.amount / 100).toFixed(2) + ' 元',
                type: 'success'
              })
              log.scope('payAopF2F.then').info(JSON.stringify(pay) + '\n' + JSON.stringify(response))
              resolve(pay)
            }).catch(error => {
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
    const getVipAmount = (pays, cardNo) => { // 查询次会员卡已付款多少钱
      let amount = 0
      pays.forEach(pay => {
        if (pay.code === cardNo) {
          amount += pay.amount
        }
      })
      return amount
    }
    VipCardGet(code).then(res => {
      log.scope('cardPay.VipCardGet.then').info(JSON.stringify(res))
      const payAmount = this.payAmount
      const beforeAmount = getVipAmount(this.order.pays, res.cardNo) // 之前已缓存付款金额
      const vipAmount = parseInt(res.amount * 100) - beforeAmount
      if (vipAmount < this.payAmount) {
        this.$store.dispatch('terminal/changePayAmount', vipAmount) // 根据会员卡余额自定义输收款金额
      }
      if (this.payAmount) {
        const afterAmount = parseInt(res.amount * 100) - beforeAmount - this.payAmount // 付款后余额
        this.$confirm( // 会员卡支付信息确认
          '<p>会员卡余额: <b style="color:#67C23A">' + res.amount.toFixed(2) + ' 元</b></p>' +
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
      log.scope('cardPay.VipCardGet.error').error(JSON.stringify(code))
      this.lock = false // 接触锁定
      this.status = 'error'
      this.payingInfo = error
    })
  },
  handerPays(pays) { // 处理未支付订单
    return new Promise(async(resolve, reject) => {
      for (let index = 0; index < pays.length; index++) {
        const pay = pays[index]
        if (pay.type === 'cardPay' && !pay.status) {
          if (pay.code) {
            await CardPay(pay.code, (pay.amount / 100).toFixed(2)).then(response => {
              pay.status = true
            }).catch(error => {
              log.scope('handerPays.CardPay').error(JSON.stringify(error.message))
              reject(error)
            })
          } else {
            reject(new Error('订单结算失败,会员卡号为空!'))
          }
        }
        if (!pay.status) {
          reject(new Error('支付方式: ' + pay.name + ' 未支付'))
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
      if (this.method) {
        // 查找创建 PayOrder
        CreatePayOrder({
          orderNo: pay.orderNo,
          method: this.method,
          authCode: pay.code,
          title: this.orderTitle,
          totalAmount: pay.amount,
          operatorId: this.username,
          terminalId: this.terminal,
          storeName: this.scanStoreName,
          stauts: USERPAYING,
          order: this.order
        }).then(payModel => {
          log.scope('CreatePayOrder.then').info(JSON.stringify(payModel))
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
          this.handerAopF2F(pay).then(response => {
            payModel.stauts = response
            payModel.save().then(res => { // 二次保存防止一次保存没有成功
              log.scope('payModel.save').info(JSON.stringify(res))
            }).catch(error => {
              log.scope('payModel.save').error(JSON.stringify(error.message))
            })
            switch (response) {
              case CLOSED:
                reject(new Error('订单已关闭!'))
                break
              case SUCCESS:
                resolve(true)
                break
            }
          }).catch(error => {
            log.scope('handerAopF2F.catch').error(JSON.stringify(error.message))
            reject(error)
          })
        }).catch(error => {
          log.scope('findCreatePayOrder.catch').error(JSON.stringify(error.message))
          reject(error)
        })
      } else {
        reject(new Error('暂不支持此付款方式!'))
      }
    })
  },
  handerAopF2F(pay) {
    return new Promise((resolve, reject) => {
      this.payingInfo = '扫码支付下单中'
      AopF2F(pay).then(response => { // 远程支付开始
        log.scope('handerAopF2FQuery.AopF2F').info(JSON.stringify(pay) + '\n' + JSON.stringify(response))
        this.payingInfo = '下单成功查询中'
        this.handerAopF2FQuery(pay).then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      }).catch(async error => {
        log.scope('handerAopF2F.AopF2F.error').error(JSON.stringify(error.message))
        if ((error.message.indexOf('Network Error') !== -1 || error.message.indexOf('timeout of') !== -1) && this.status === 'paying') { // 下单超时并且在付款状态中、非付款状态自动进入查询
          this.payingInfo = '服务器超时,等待重试。'
          const sleep = 6
          await Sleep((sleep - 1) * 1000)// 等待
          this.payingInfo = '重新下单中'
          if (this.isPay) { // 支付页面关闭后不再下单
            this.handerAopF2F(pay).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          }
        } else {
          this.payingInfo = '下单错误支付查询中'
          this.handerAopF2FQuery(pay).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        }
      })
    })
  },
  handerAopF2FQuery(pay) {
    return new Promise((resolve, reject) => {
      Query(pay).then(response => {
        log.scope('handerAopF2FQuery.Query').info(JSON.stringify(pay) + '\n' + JSON.stringify(response))
        this.handerAopF2FResponse(response, pay).then(res => {
          resolve(res)
        }).catch(err => {
          reject(err)
        })
      }).catch(async error => {
        log.scope('handerAopF2FQuery.Query.error').error(JSON.stringify(error.message))
        if (this.status === 'waitClose') { // 从关闭等待状态进入关闭状态
          this.status = 'off'
          reject(error)
        }
        if (error.message.indexOf('timeout of') !== -1) {
          this.payingInfo = '查询超时,等待中。'
        }
        const sleep = 6
        await Sleep((sleep - 1) * 1000)// 等待
        this.payingInfo = '查询错误再次支付查询中'
        if (this.isPay) { // 支付页面关闭后不再查询
          this.handerAopF2FQuery(pay).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        } else {
          reject(error)
        }
      })
    })
  },
  handerAopF2FResponse(response, pay) {
    return new Promise(async(resolve, reject) => {
      const sleep = 6
      const data = response.data
      switch (data.order.stauts) {
        case 'CLOSED':
          resolve(CLOSED)
          break
        case 'USERPAYING':
          if (this.status === 'waitClose') { // 从关闭等待状态进入关闭状态
            this.status = 'off'
          }
          this.payingInfo = '等待用户付款中'
          await Sleep((sleep - 1) * 1000)// 等待
          this.payingInfo = '扫码支付查询中'
          if (this.isPay) { // 支付页面关闭后不再查询
            this.handerAopF2FQuery(pay).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          }
          break
        case 'SUCCESS':
          resolve(SUCCESS)
          break
      }
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
      log.scope('handerPay.initInfo').info(id) // debug 可注释
      let payInfo = {}
      this.pays.forEach(pay => {
        if (String(pay.id) === String(id)) { // 获取使用的支付方式信息
          if (this.order.type) {
            if (this.order.waitPay > 0) {
              const amount = this.payAmount >= this.order.waitPay ? this.order.waitPay : this.payAmount // 计算付款金额tatus: pay.type === 'cashPay' // 现金支付时默认支付状态成功
              const getAmount = pay.type === 'cashPay' ? (this.payAmount === 0 ? amount : this.payAmount) : amount // 收到的钱[现金可以多少其他不允许]
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
              this.status = 'error'
              this.payingInfo = '退货只允许现金形式'
              return
            }
          }
          if (pay.type !== 'scanPay') {
            this.method = pay.type
          }
          log.scope('payHander.payInfo').info(JSON.stringify(payInfo))
          this.payHander(payInfo).then(async response => {
            this.order.pays.push(response) // 增加支付方式
            this.$store.dispatch('terminal/handerOrder') // 更新订单信息
            this.payingInfo = '支付成功订单处理中'
            this.handerOrder() // 处理订单支付
            this.lock = false
          }).catch(error => {
            log.scope('payHander.error').error(JSON.stringify(error.message))
            this.status = 'error'
            this.payingInfo = error.message
            this.lock = false
            return
          })
        }
      })
    } catch (error) {
      this.lock = false
      log.scope('handerPay.error').error(JSON.stringify(error.message))
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
  handerOrder() {
    if (this.order.waitPay === 0) {
      this.handerPays(this.order.pays).then(() => { // 处理订单支付
        EndOrder(this.order, this)
      }).catch(error => {
        log.scope('handerPays.error').error(JSON.stringify(error.message))
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
