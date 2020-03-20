import sequelize from '@/model/payOrder'
const PayOrder = sequelize.models.payOrder

// 更新用户密码
export function findCreate(order, pay) {
  return new Promise((resolve, reject) => {
    PayOrder.create({ // 不存在创建订单
      orderNo: pay.orderNo,
      pay: pay,
      order: order,
      stauts: false
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

// 更新订单状态
export function StautsUpdate(orderNo, stauts) {
  return new Promise((resolve, reject) => {
    PayOrder.update({
      stauts: stauts
    }, {
      where: {
        orderNo: orderNo
      }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
