
import sequelize from '@/model/orderPD'
const Order = sequelize.models.order
const Goods = sequelize.models.good
const Snapshots = sequelize.models.snapshot
import { pagination } from '@/utils/index'

export function List(listQuery) {
  return new Promise((resolve, reject) => {
    const page = pagination(listQuery.limit, listQuery.page)
    Order.findAndCountAll({
      offset: page.offset,
      limit: page.limit,
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

export function Empty() {
  return new Promise((resolve, reject) => {
    sequelize.sync({
      force: true
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
export function Create(order) {
  return new Promise((resolve, reject) => {
    Order.create(order, {
      include: [Order.Goods, Order.Pays]
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function All(where = {}) {
  return new Promise((resolve, reject) => {
    Order.findAll({
      where: where,
      include: [Order.Goods, Order.Pays]
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
