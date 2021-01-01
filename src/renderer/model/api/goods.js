import sequelize from '@/model/goods'
const Goods = sequelize.models.good
const BarCodes = sequelize.models.barCode

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
    Goods.sequelize.transaction((t) => { // 基于事务插入数据
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
    Goods.sequelize.transaction((t) => { // 基于事务插入数据
      return Goods.findOne({ where: { barCode: barcode }, transaction: t }).then(goods => {
        if (goods) {
          resolve(goods)
        } else {
          return BarCodes.findOne({ where: { barCode: barcode }, transaction: t }).then(barcode => {
            if (barcode) {
              return Goods.findOne({ where: { pluCode: barcode.pluCode }, transaction: t }).then(goods => {
                if (goods) {
                  goods.name = barcode.name
                  goods.spec = barcode.spec
                  goods.barCode = barcode.barCode
                  resolve(goods)
                }
              })
            } else {
              resolve(goods)
            }
          })
        }
      })
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
