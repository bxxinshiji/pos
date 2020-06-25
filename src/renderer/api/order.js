import store from '@/store'
import { OrderNo as SQL2000OrderNo } from '@/sql2000/utils/order'
const SQL2000OrderSQL = import('@/sql2000/model/order')
import sequelize from '@/model/order'
const Order = sequelize.models.order
import log from '@/utils/log'
/**
 * OrderNo 订单编号定义
 * @returns {Promise}
 */
export async function OrderNo(terminal, type) {
  return SQL2000OrderNo(terminal, type)
}
/**
 * syncOrder 同步订单
 */
export function syncOrder(order) {
  return new Promise(async(resolve, reject) => {
    await SQL2000OrderSQL.then(async sql => {
      await sql.default.Create(order).then(async response => {
        await Order.update({ // 本地订单状态改为报送服务器
          publish: true
        }, {
          where: { orderNo: order.orderNo }
        })
        store.dispatch('terminal/changeOrderInfo') // 更新订单汇总信息
        resolve(response)
      }).catch(error => {
        log.scope('syncOrder.Create').info(JSON.stringify(error.message))
        reject(error)
      })
    }).catch(error => {
      log.scope('syncOrder.SQL2000OrderSQL').info(JSON.stringify(error.message))
      reject(error)
    })
  })
}

/**
 * queueSyncOrder 队列
 */
export function queueSyncOrder() {
  return new Promise((resolve, reject) => {
    Order.findAll({
      where: { publish: false },
      include: [Order.Goods, Order.Pays]
    }).then(async response => {
      for (let index = 0; index < response.length; index++) {
        const element = response[index]
        await syncOrder(element).then(res => {
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      }
    }).catch(error => {
      reject(error)
    })
  })
}
