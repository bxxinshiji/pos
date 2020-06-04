import store from '@/store'
import { Notification, MessageBox, Message } from 'element-ui'
import { AopF2F, Query } from '@/api/pay'
import { syncOrder } from '@/api/order'
import { Pay as CardPay, Get as VipCardGet } from '@/api/vip_card'
import { parseTime } from '@/utils/index'
import { Sleep } from '@/utils'
import print from '@/utils/print'
import utilsPay from '@/utils/pay'

import { findCreate as findCreatePayOrder, StautsUpdate as StautsUpdatePayOrder } from '@/model/api/payOrder'
import { AddPrint } from '@/model/api/order'
import orderSequelize from '@/model/order'
const Order = orderSequelize.models.order

// 完结订单
const EndOrder = (order, self) => {
  Order.create(order, {
    include: [Order.Goods, Order.Pays]
  }).then(orderRes => {
    async() => {
      if (print.switch()) {
        let cashdraw = false
        order.pays.forEach(pay => { // 钱箱控制
          if (pay.name === '现金') {
            cashdraw = true
          }
        })
        print.hander(orderRes, cashdraw).then(response => {
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
      store.dispatch('terminal/changeOrderInfo') // 更新订单汇总信息
      syncOrder(orderRes) // 异步同步服务器订单
    }
    order.status = true // 订单完结
    self.handleClose() // 关闭页面
  }).catch(error => {
    // 删除出错关联插入订单数据
    // Order.destroy({ where: { orderNo: order.orderNo }})
    MessageBox.confirm('未知错误请重新下单,或加载订单。' + error.message, '创建订单错误', {
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
            //     this.lock = false // 解除支付锁定
            //     resolve(pay)
            //   }).catch(error => {
            //     this.lock = false // 解除支付锁定
            //     reject(error)
            //   })
            // } else {
            //   reject(new Error('请刷卡!会员卡号不允许为空'))
            // }
            this.lock = false // 解除支付锁定
            resolve(pay)
            break
          case 'remoteCardPay':
            console.log('remoteCardPay')
            break
          case 'scanPay':
            this.scand = true
            await this.payAopF2F(pay).then(response => {
              pay.status = response || false
              this.scand = false
              this.lock = false // 解除支付锁定
              Notification({
                title: '支付成功',
                message: '订单金额: ' + (pay.amount / 100).toFixed(2) + ' 元',
                type: 'success'
              })
              resolve(pay)
            }).catch(error => {
              this.scand = false
              this.lock = false // 解除支付锁定
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
          this.$message({
            type: 'warning',
            message: '会员卡支付已取消'
          })
        })
      } else {
        this.$store.dispatch('terminal/changePayAmount', payAmount) // 无法付款时恢复 付款金额
        this.error = '账户余额为零'
      }
    }).catch(error => {
      this.error = error
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
    return new Promise(async(resolve, reject) => {
      const code = pay.code
      // pay.orderNo = uuidv4().replace(/\-/g, '') // 支付宝、微信等支付指定订单单号[UUID生成]
      pay.orderNo = this.order.orderNo + parseTime(new Date(), '{h}{i}{s}{n}')
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
          storeName: this.scanStoreName,
          method: method,
          authCode: pay.code,
          title: this.orderTitle,
          orderNo: pay.orderNo,
          totalAmount: pay.amount,
          operatorId: this.username,
          terminalId: this.terminal
        }).then(async res => {
          await this.handerAopF2F(res.pay).then(response => {
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
  handerAopF2F(pay) {
    return new Promise(async(resolve, reject) => {
      this.warning = '下单中'
      await AopF2F(pay).then(async response => { // 远程支付开始
        await this.handerAopF2FQuery(pay).then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      }).catch(async error => {
        if (error.message.indexOf('Network Error') !== -1 || error.message.indexOf('timeout of') !== -1) {
          this.warning = '服务器超时,等待重试。'
          const sleep = 6
          await Sleep((sleep - 1) * 1000)// 等待
          this.warning = '重新下单中'
          if (this.isPay) { // 支付页面关闭后不再下单
            await this.handerAopF2F(pay).then(response => {
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          }
        } else {
          await this.handerAopF2FQuery(pay).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        }
      })
    })
  },
  handerAopF2FQuery(pay) {
    return new Promise(async(resolve, reject) => {
      this.warning = '支付查询中'
      await Query(pay).then(async response => {
        await this.handerAopF2FResponse(response, pay).then(res => {
          resolve(res)
        }).catch(err => {
          reject(err)
        })
      }).catch(async error => {
        if (error.message.indexOf('timeout of') !== -1) {
          this.warning = '查询超时,等待中。'
        } else {
          const detail = error.response.data.detail
          this.$notify({
            type: 'error',
            title: '查询失败',
            message: detail
          })
        }
        const sleep = 6
        await Sleep((sleep - 1) * 1000)// 等待
        this.warning = '支付查询中'
        if (this.isPay) { // 支付页面关闭后不再查询
          await this.handerAopF2FQuery(pay).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        }
      })
    })
  },
  handerAopF2FResponse(response, pay) {
    return new Promise(async(resolve, reject) => {
      utilsPay.hander(response.data, pay.method)
      if (utilsPay.valid) {
        resolve(utilsPay.valid)
      } else {
        if (utilsPay.error.code === 'USERPAYING') {
          this.warning = '等待用户付款中'
          const sleep = 6
          await Sleep((sleep - 1) * 1000)// 等待
          this.warning = '支付查询中'
          await this.handerAopF2FQuery(pay).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        } else {
          this.$notify({
            type: 'error',
            title: '未支付',
            message: utilsPay.error.detail
          })
          reject(utilsPay.error.detail)
        }
      }
    })
  },
  scanPay(code) {
    if (!this.scanStoreName) {
      this.error = '请设置付款商家'
      return
    }
    if (!this.scanPayId) {
      this.error = '扫码付款方式未设置'
      return
    }
    // if (this.payAmount < this.order.waitPay) {
    //   this.error = '扫码付款必须大于待付款金额!【多笔付款请最后支付】'
    //   return
    // }
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
      this.handerPays(this.order.pays).then(() => { // 处理订单支付
        EndOrder(this.order, this)
      }).catch(error => {
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
