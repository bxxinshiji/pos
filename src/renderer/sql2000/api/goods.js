// sync 同步数据
import SQLGoods from '@/sql2000/model/goods'
import SQLBarcode from '@/sql2000/model/barcode'
import sequelize from '@/model/goods'
import { Message } from 'element-ui'

const Goods = sequelize.models.good
const BarCodes = sequelize.models.barCode

export async function SyncPlu() {
  return new Promise(async(resolve, reject) => {
    let goods = []
    let editAt = ''
    await Goods.findOne({
      attributes: ['editAt'],
      order: [['editAt', 'DESC']]
    }).then(res => {
      editAt = res ? res.editAt : new Date('2004')
    })
    const CurrentDate = (new Date()).getFullYear()
    for (let index = editAt.getFullYear(); index <= CurrentDate; index++) {
      editAt = new Date(String(index))
      await SQLGoods.List(editAt).then(async response => {
        if (response) {
          response.forEach(item => {
            item.price = Math.round(item.price * 100)
            goods.push({
              pluCode: item.pluCode,
              barCode: item.barCode,
              depCode: item.depCode,
              price: item.price,
              name: item.name,
              unit: item.unit,
              spec: item.spec,
              type: Number(item.type) ? 1 : 0, // [0普通商品 1称重商品 2 承受不定商品 3金额管理商品] 转成 0 1
              snapshot: item,
              editAt: item.editAt
            })
          })
          await Goods.bulkCreate(goods, { updateOnDuplicate: ['barCode', 'depCode', 'price', 'name', 'unit', 'spec', 'type', 'snapshot', 'editAt'] }).then(() => {
            Message({
              showClose: true,
              message: editAt.getFullYear() + '年商品同步成功',
              type: 'success'
            })
          }).catch(error => {
            console.error(error)
            reject(new Error('插入商品PLU失败'))
          })
          goods = []
        }
      }).catch(error => {
        console.error(error)
        reject(new Error('查询商品PLU失败'))
      })
    }

    let barCodes = []
    await SQLBarcode.All().then(async response => {
      if (response) {
        response.forEach(item => {
          barCodes.push({
            pluCode: item.pluCode,
            barCode: item.barCode,
            name: item.name,
            spec: item.spec
          })
        })
        await BarCodes.bulkCreate(barCodes,
          { updateOnDuplicate: ['pluCode', 'name', 'spec'] }
        ).then(() => {
        }).catch(error => {
          console.error(error)
          reject(new Error('插入商品条码失败'))
        })
        barCodes = []
      }
    }).catch(error => {
      console.error(error)
      reject(new Error('查询商品条码失败'))
    })

    resolve()
  })
}
