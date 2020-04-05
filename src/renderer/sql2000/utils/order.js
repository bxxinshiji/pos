const Op = require('sequelize').Op
import sequelize from '@/model/order'
const Order = sequelize.models.order
import sequelizePD from '@/model/orderPD'
const OrderPD = sequelizePD.models.order
import { parseTime, addPreZero } from '@/utils/index'
/**
 * OrderNo 订单编号定义
 * @returns {Promise}
 */
export async function OrderNo(terminal, type) {
  return new Promise(async(resolve, reject) => {
    const date = parseTime(new Date(), '{y}{m}{d}').substr(2, 6)
    var orderNo = terminal + date
    let orderModel = Order
    if (type === 'orderPD') {
      orderModel = OrderPD
    }
    await orderModel.findOne({
      order: [['orderNo', 'DESC']],
      where: {
        orderNo: {
          [Op.like]: '%' + orderNo + '%'
        }
      }
    }).then(order => {
      if (order) {
        const no = Number(order.orderNo.substr(-4)) + 1
        if (no > 9999) {
          reject(new Error('订单编号大于9999'))
        } else {
          orderNo = orderNo + addPreZero(no, 4)
        }
      } else {
        orderNo = orderNo + addPreZero(1, 4)
      }
      resolve(orderNo)
    })
  })
}
