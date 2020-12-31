
const { Op } = require('sequelize')
import sequelize from '@/model/order'
const Order = sequelize.models.order
const Goods = sequelize.models.good
const Pays = sequelize.models.pay
const Snapshots = sequelize.models.snapshot

import paySequelize from '@/model/payOrder'
const PayOrder = paySequelize.models.payOrder
import { pagination } from '@/utils/index'

export function List(listQuery) {
  return new Promise((resolve, reject) => {
    const page = pagination(listQuery.limit, listQuery.page)
    Order.sequelize.transaction((t) => { // 基于事务插入数据
      return Order.findAndCountAll({
        offset: page.offset,
        limit: page.limit,
        order: listQuery.order,
        where: listQuery.where,
        include: [Order.Goods, Order.Pays],
        transaction: t
      })
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function Create(order) {
  console.log(order)

  return new Promise((resolve, reject) => {
    Order.sequelize.transaction((t) => { // 基于事务插入数据
      return Order.create(order, {
        include: [Order.Goods, Order.Pays],
        transaction: t
      })
    }).then(response => {
      console.log(response)
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function Delete(order) {
  return new Promise((resolve, reject) => {
    Order.destroy({
      where: {
        orderNo: order.orderNo
      }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function All(listQuery) {
  return new Promise((resolve, reject) => {
    Order.findAndCountAll({
      order: listQuery.order,
      where: listQuery.where,
      include: [Order.Goods, Order.Pays]
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
// AddPrint 增加打印次数
export function AddPrint(order) {
  return new Promise((resolve, reject) => {
    Order.update({ // 本地订单状态改为报送服务器
      print: sequelize.literal('print+1')
    }, {
      where: { orderNo: order.orderNo }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
// Publish 发布订单
export function Publish(where) {
  return new Promise((resolve, reject) => {
    Order.update({ // 本地订单状态改为报送服务器
      publish: true
    }, {
      where: where
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

// GoodsSnapshot 处理商品信息合并商品信息快照
export async function GoodsSnapshot(goods) {
  for (let index = 0; index < goods.length; index++) { // 合并商品快照
    var item = goods[index]
    if (item.snapshotId) {
      await Snapshots.findOne({
        attributes: ['snapshot'],
        where: { id: item.snapshotId }
      }).then(request => {
        item = Object.assign(item, request.snapshot)
      })
    }
  }
}

export function DepTotal(listQuery) {
  return new Promise((resolve, reject) => {
    Goods.findAll({
      attributes: ['depCode', 'total'],
      group: 'depCode',
      where: listQuery.where
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
export async function Info(userId) {
  const info = {
    count: 0,
    returns: 0,
    total: 0,
    publish: 0,
    pays: []
  }
  const createdAt = { // 获取当天订单
    [Op.lt]: new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1),
    [Op.gt]: new Date(new Date(new Date().toLocaleDateString()).getTime())
  }
  await Order.count({
    where: {
      userId: userId,
      createdAt: createdAt
    }
  }).then(response => {
    info.count = response || 0
  })
  await Order.count({
    where: {
      type: 0,
      userId: userId,
      createdAt: createdAt
    }
  }).then(response => {
    info.returns = response || 0
  })
  await Order.sum('total', {
    where: {
      userId: userId,
      createdAt: createdAt
    }
  }).then(response => {
    info.total = response || 0
  })
  await Order.count({
    where: {
      publish: 0
    }
  }).then(response => {
    info.publish = response || 0
  })
  await Pays.findAll({
    attributes: ['payId', 'name', 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'amount']],
    group: 'payId',
    include: [{ // include关键字表示关联查询
      model: Order, // 指定关联的model
      attributes: [],
      where: {
        userId: userId,
        createdAt: createdAt
      }
    }]
  }).then(response => {
    info.pays = response
  })
  await PayOrder.sum('totalAmount', { // 查询支付成功的实际金额
    where: {
      operatorId: userId,
      stauts: 1,
      createdAt: createdAt
    }
  }).then(response => {
    info.payTotal = response || 0
  })
  return info
}

// 更新订单编号
export function UpdateOrderNo(orderId, orderNo) {
  return new Promise((resolve, reject) => {
    Order.update({ // 本地订单状态改为报送服务器
      orderNo: orderNo
    }, {
      where: { id: orderId }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
