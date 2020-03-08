
import sequelize from '@/model/order'
const Order = sequelize.models.order
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
