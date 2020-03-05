
import { Notification, Message } from 'element-ui'
import { Pay as CardPay, Get as VipCardGet } from '@/api/vip_card'
import { syncOrder } from '@/api/order'
import { parseTime } from '@/utils/index'
import print from '@/utils/print'
import sequelize from '@/model/order'
const Order = sequelize.models.order

// 完结订单
const EndOrder = (order, self) => {
  Order.create(order, {
    include: [Order.Goods, Order.Pays]
  }).then(orderRes => {
    order.createdAt = parseTime(orderRes.createdAt, '{y}-{m}-{d} {h}:{i}:{s}') // 订单下单时间
    if (print.switch()) {
      print.hander(order).then(response => {
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
// const payError = (error) => {
//   console.error(error)
//   MessageBox.confirm(error
//     , '支付失败', {
//       type: 'error',
//       showCancelButton: false,
//       showConfirmButton: false,
//       dangerouslyUseHTMLString: true
//     }).then(() => {
//   }).catch(() => {
//   })
// }
// 支付订单
const payHander = (pay) => {
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
          console.log('scanPay')
          break
        case 'cashPay':
          pay.status = true // 现金支付时默认支付状态成功
          resolve(pay)
          break
      }
    }
  })
}
const hander = {
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
  handerPay(id, code = '') { // 根据付款方式ID 整合付款信息
    let payInfo = {}
    this.pays.forEach(pay => {
      if (String(pay.id) === String(id)) {
        if (this.order.type) {
          if (this.order.waitPay > 0) {
            const amount = this.payAmount >= this.order.waitPay ? this.order.waitPay : this.payAmount // 计算付款金额tatus: pay.type === 'cashPay' // 现金支付时默认支付状态成功
            const getAmount = pay.type === 'cashPay' ? (this.payAmount === 0 || amount) : amount // 收到的钱[现金可以多少其他不允许]
            const orderNo = this.order.orderNo + '_' + pay.id + '_' + this.order.pays.length// 支付宝、微信等支付指定订单单号[订单编号+支付方式ID+支付序号]
            payInfo = {
              payId: pay.id, // 支付方式
              name: pay.name, // 支付方式名称
              type: pay.type, // 支付方式
              code: code, // 会员卡
              amount: amount, // 支付金额
              getAmount: getAmount, // 收到的钱[现金可以多少其他不允许]
              orderNo: orderNo, // 支付宝、微信等支付指定订单单号[订单编号+支付方式ID+支付序号]
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
              orderNo: '', // 支付宝、微信等支付指定订单单号[订单编号+支付方式ID+支付序号]
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
        payHander(payInfo).then(response => {
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
        message: '订单还未完结,请支付剩余货款。金额: ' + (this.order.waitPay * 0.01).toFixed(2) + ' 元'
      })
    }
  }
}
export default hander
