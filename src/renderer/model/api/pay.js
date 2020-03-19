import sequelize from '@/model/pay'
const Pay = sequelize.models.pay

// 更新用户密码
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
