// sync 同步数据
import SQLGoods from '@/sql2000/model/goods'
import SQLBarcode from '@/sql2000/model/barcode'
import sequelize from '@/model/goods'
import { parseTime } from '@/utils/index'

const Goods = sequelize.models.good
const BarCodes = sequelize.models.barCode

export async function SyncPlu() {
  return new Promise(async(resolve, reject) => {
    const goods = []
    let editAt = ''
    await Goods.findOne({
      attributes: ['editAt'],
      order: [['editAt', 'DESC']]
    }).then(res => {
      editAt = res ? parseTime(res.editAt, '{y}-{m}-{d} {h}:{i}:{s}') : '2010-01-01 00:00:00'
    })
    await SQLGoods.List(editAt).then(async response => {
      if (response) {
        response.forEach(item => {
          goods.push({
            pluCode: item.pluCode,
            barCode: item.barCode,
            depCode: item.depCode,
            price: Math.round(item.price * 100),
            name: item.name,
            unit: item.unit,
            spec: item.spec,
            type: Number(item.type) ? 1 : 0, // [0普通商品 1称重商品 2 承受不定商品 3金额管理商品] 转成 0 1
            snapshot: item,
            editAt: item.editAt
          })
        })
      }
    }).catch(error => {
      console.error(error)
      reject(new Error('查询商品PLU失败'))
    })

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

    if (barCodes.length > 0 && goods.length > 0) {
      // 重新构建数据库文件
      // await sequelize.sync({
      //   force: true
      // })
      await BarCodes.bulkCreate(barCodes,
        { updateOnDuplicate: ['pluCode', 'name', 'spec'] }).then(() => {
      }).catch(error => {
        console.error(error)
        reject(new Error('插入商品条码失败'))
      })
      await Goods.bulkCreate(goods, { updateOnDuplicate: ['barCode', 'depCode', 'price', 'name', 'unit', 'spec', 'type', 'snapshot', 'editAt'] }).then(() => {
      }).catch(error => {
        console.error(error)
        reject(new Error('插入商品PLU失败'))
      })
    } else {
      reject(new Error('未找到更新商品信息'))
    }
    resolve()
  })
}
