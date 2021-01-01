import sequelize from '@/model/goods'
const Goods = sequelize.models.good

export function bulkCreate(goods, options) {
  return new Promise((resolve, reject) => {
    Goods.sequelize.transaction((t) => { // 基于事务插入数据
      return Goods.bulkCreate(goods, Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function findOne(options) {
  return new Promise((resolve, reject) => {
    Goods.sequelize.transaction((t) => { // 基于事务插入数据
      return Goods.findOne(Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function plucodeByGoods(pluCode) {
  return new Promise((resolve, reject) => {
    Goods.sequelize.transaction((t) => {
      return Goods.findOne({ where: { pluCode: pluCode }, transaction: t })
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function barcodeByGoods(barcode) {
  return new Promise((resolve, reject) => {
    Goods.sequelize.transaction((t) => {
      return Goods.findOne({ where: { barCode: barcode }, transaction: t })
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function destroy(options) {
  return new Promise((resolve, reject) => {
    Goods.sequelize.transaction((t) => { // 基于事务插入数据
      return Goods.destroy(Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
