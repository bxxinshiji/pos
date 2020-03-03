// sync 同步数据
import SQLGoods from '@/sql2000/model/goods'
import SQLBarcode from '@/sql2000/model/barcode'
import sequelize from '@/model/goods'

const Goods = sequelize.models.good
const BarCodes = sequelize.models.barCode

export async function SyncPlu() {
  return new Promise(async(resolve, reject) => {
    const barCodes = []
    await SQLBarcode.All().then(response => {
      if (response) {
        response.forEach(item => {
          barCodes.push({
            pluCode: item.pluCode,
            barCode: item.barCode,
            name: item.name,
            spec: item.spec
          })
        })
      }
    }).catch(error => {
      console.error(error)
      reject(new Error('查询商品条码失败'))
    })

    const goods = []
    await SQLGoods.List().then(async response => {
      if (response) {
        response.forEach(item => {
          goods.push({
            pluCode: item.pluCode,
            barCode: item.barCode,
            editAt: item.editAt,
            price: Math.round(item.price * 100),
            name: item.name,
            unit: item.unit,
            spec: item.spec,
            type: Number(item.type) ? 1 : 0, // [0普通商品 1称重商品 2 承受不定商品 3金额管理商品] 转成 0 1
            snapshot: item
          })
        })
      }
    }).catch(error => {
      console.error(error)
      reject(new Error('查询商品PLU失败'))
    })

    if (barCodes.length > 0 && goods.length > 0) {
      // 重新构建数据库文件
      await sequelize.sync({
        force: true
      })
      BarCodes.bulkCreate(barCodes).then(() => {
      }).catch(error => {
        console.error(error)
        reject(new Error('插入商品条码失败'))
      })
      Goods.bulkCreate(goods).then(() => {
      }).catch(error => {
        console.error(error)
        reject(new Error('插入商品PLU失败'))
      })
    } else {
      reject(new Error('查询商品数量为0'))
    }
    resolve()
  })
}
