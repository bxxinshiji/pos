import sequelize from '@/model/goods'
const Plu = sequelize.models.plu
const Bar = sequelize.models.bar

export function bulkCreatePlu(goods, options) {
  return new Promise((resolve, reject) => {
    Plu.sequelize.transaction((t) => { // 基于事务插入数据
      return Plu.bulkCreate(goods, Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
export function bulkCreateBar(goods, options) {
  return new Promise((resolve, reject) => {
    Bar.sequelize.transaction((t) => { // 基于事务插入数据
      return Bar.bulkCreate(goods, Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function findOne(options) {
  return new Promise((resolve, reject) => {
    Plu.sequelize.transaction((t) => { // 基于事务插入数据
      return Plu.findOne(Object.assign(options, { transaction: t }))
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function plucodeByGoods(pluCode) {
  return new Promise((resolve, reject) => {
    Plu.sequelize.transaction((t) => {
      return Plu.findOne({ where: { pluCode: pluCode }, transaction: t })
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}

export function barcodeByGoods(barcode) {
  return new Promise((resolve, reject) => {
    Bar.sequelize.transaction((t) => {
      return Bar.findOne({ where: { barCode: barcode }, transaction: t })
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
