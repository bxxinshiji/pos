import { Notification, Message } from 'element-ui'
import { Pay as CardPay, Get as VipCardGet } from '@/api/vip_card'
import { syncOrder } from '@/api/order'
import { AddPrint } from '@/model/api/order'
import { parseTime } from '@/utils/index'
import print from '@/utils/print'
import sequelize from '@/model/order'
const Order = sequelize.models.order
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
    // 关联插入出错删除订单数据
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
            await this.payAopF2F(pay).then(response => {
              pay.status = true
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
    VipCardGet(code).then(response => {
      if (response.amount * 100 < this.payAmount) {
        this.$store.dispatch('terminal/changePayAmount', response.amount * 100) // 开启支付页面的收款金额
      }
      if (this.payAmount) {
        this.handerPay(response.id, response.cardNo)
      } else {
        Message({
          type: 'error',
          message: '账户余额为零'
        })
      }
    }).catch(error => {
      Message({
        type: 'error',
        message: error
      })
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
        // 检测唯一扫码支付
        // 获取位置扫码支付
        // 不允许其他支付方式
        const scanOrder = {
          storeId: this.scanStoreId,
          method: method,
          authCode: code,
          title: this.order.orderNo,
          orderNo: this.order.orderNo + parseTime(new Date(), '{h}{i}{s}{n}'),
          totalAmount: pay.amount,
          operatorId: this.username,
          terminalId: this.terminal
        }

        console.log(this.order)
        console.log(scanOrder)
        console.log(this.username, this.scanPayId, this.terminal, this.scanStoreId)
      } else {
        Message({
          type: 'warning',
          message: '暂不支持此付款方式!'
        })
        return
      }
    })
  },
  scanPay(code) {
    if (!this.scanStoreId) {
      Message({
        type: 'error',
        message: '请设置付款商家!'
      })
      return
    }
    if (!this.scanPayId) {
      Message({
        type: 'error',
        message: '扫码付款方式未设置!'
      })
      return
    }
    if (this.payAmount < this.order.waitPay) {
      Message({
        type: 'warning',
        duration: 10000,
        message: '扫码付款必须大于代付款金额!【多笔付款请最后支付】'
      })
      return
    }
    this.handerPay(this.scanPayId, code)
  },
  handerPay(id, code = '') { // 根据付款方式ID 整合付款信息
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
            Message({
              type: 'error',
              message: '退货只允许现金形式'
            })
            return
          }
        }
        this.payHander(payInfo).then(response => {
          this.order.pays.push(response)
          this.$store.dispatch('terminal/handerOrder') // 更新订单信息
          this.handerOrder() // 处理订单支付
        }).catch(error => {
          Message({
            type: 'error',
            message: error
          })
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
