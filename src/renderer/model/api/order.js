
import sequelize from '@/model/order'
const Order = sequelize.models.order
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
