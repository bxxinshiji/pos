import sequelize from '@/model/pay'
const Pay = sequelize.models.pay

// 获取支付信息
export function Get(listQuery) {
  return new Promise((resolve, reject) => {
    Pay.findAll({
      where: listQuery.where
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
