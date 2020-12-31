import sequelize from '@/model/goods'
const barCode = sequelize.models.barCode

export function bulkCreate(goods, options) {
  return new Promise((resolve, reject) => {
    barCode.sequelize.transaction((t) => { // 基于事务插入数据
      return barCode.bulkCreate(goods, Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function findOne(options) {
  return new Promise((resolve, reject) => {
    barCode.sequelize.transaction((t) => { // 基于事务插入数据
      return barCode.findOne(Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function destroy(options) {
  return new Promise((resolve, reject) => {
    barCode.sequelize.transaction((t) => { // 基于事务插入数据
      return barCode.destroy(Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
