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
    SQL2000OrderSQL.then(sql => {
      sql.default.Create(order).then(async response => {
        resolve(response)
      }).catch(error => {
        log.h('error', 'syncOrder.Create', JSON.stringify(error.message) + JSON.stringify(order))
        reject(error)
      })
    }).catch(error => {
      log.h('error', 'syncOrder.SQL2000OrderSQL', JSON.stringify(error.message) + JSON.stringify(order))
      reject(error)
    })
  })
}

/**
 * queueSyncOrder 队列
 */
export function queueSyncOrder() {
  return new Promise((resolve, reject) => {
    const sleep = function(time) {
      return new Promise((resolve) => setTimeout(resolve, time))
    }

    Order.findAll({
      where: { publish: false },
      include: [Order.Goods, Order.Pays]
    }).then(async response => {
      for (let index = 0; index < response.length; index++) {
        await sleep(10 * 1000) // 每个订单休息10秒后在上传
        const element = response[index]
        log.h('info', 'queueSyncOrder.element', JSON.stringify(element))
        syncOrder(element).then(res => {
          Order.update({ // 本地订单状态改为报送服务器
            publish: true
          }, {
            where: { orderNo: element.orderNo }
          })
          store.dispatch('terminal/changeOrderInfo') // 更新订单汇总信息
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
