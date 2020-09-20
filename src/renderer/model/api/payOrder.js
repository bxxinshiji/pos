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

// 创建订单
export function Create(pay) {
  return new Promise((resolve, reject) => {
    PayOrder.create(pay).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
// 查找创建订单
export function upsert(pay) {
  return new Promise((resolve, reject) => {
    PayOrder.upsert(pay).then(response => {
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
// 更新订单绑定订单编号
export function UpdateBuildOrderNo(orderNo, buildOrderNo) {
  return new Promise((resolve, reject) => {
    PayOrder.update({
      buildOrderNo: buildOrderNo
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
