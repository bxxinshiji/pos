import sequelize from '@/model/payOrder'
const PayOrder = sequelize.models.payOrder
import { pagination } from '@/utils/index'

export function List(listQuery) {
  return new Promise((resolve, reject) => {
    const page = pagination(listQuery.limit, listQuery.page)
    PayOrder.findAndCountAll({
      offset: page.offset,
      limit: page.limit,
      order: listQuery.order,
      where: listQuery.where
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

// 查找创建订单
export function findCreate(order, pay) {
  return new Promise((resolve, reject) => {
    PayOrder.create({ // 不存在创建订单
      orderNo: pay.orderNo,
      method: pay.method,
      authCode: pay.authCode,
      totalAmount: pay.totalAmount,
      operatorId: pay.operatorId,
      terminalId: pay.terminalId,
      storeName: pay.storeName,
      storeId: pay.storeId,
      title: pay.title,
      stauts: false,
      order: order
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
