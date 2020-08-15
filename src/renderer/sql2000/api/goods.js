// sync 同步数据
import SQLGoods from '@/sql2000/model/goods'
import SQLBarcode from '@/sql2000/model/barcode'
import sequelize from '@/model/goods'
import { Message } from 'element-ui'
import { parseTime } from '@/utils/index'

const Goods = sequelize.models.good
const BarCodes = sequelize.models.barCode

export async function SyncPlu(enforce = false) {
  return new Promise(async(resolve, reject) => {
    // 更新商品
    let updatedAt = new Date('2004')
    await Goods.findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    }).then(res => {
      updatedAt = res ? res.updatedAt : new Date('2004')
    })
    const sync = async(updatedAt, endAt) => {
      await SQLGoods.List(updatedAt, endAt).then(async response => {
        let goods = []
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
              updatedAt: item.updatedAt
            })
          })
          await Goods.bulkCreate(goods, { updateOnDuplicate: ['barCode', 'depCode', 'price', 'name', 'unit', 'spec', 'type', 'snapshot', 'updatedAt'] }).then(() => {
            Message({
              showClose: true,
              message: parseTime(updatedAt) + ' - ' + parseTime(endAt) + ' 商品同步成功',
              type: 'success'
            })
          }).catch(error => {
            reject(new Error('插入商品PLU失败:' + error.message))
          })
          goods = []
        }
      }).catch(error => {
        reject(new Error('查询商品PLU失败:' + error.message))
      })
    }
    if (enforce) { // 强制执行时更新所有商品信息
      updatedAt = new Date('2004')
    }

    const CurrentDate = new Date().getFullYear()
    if (updatedAt.getFullYear() < CurrentDate) {
      for (let index = updatedAt.getFullYear(); index <= CurrentDate; index++) {
        updatedAt = new Date(index + '-01-01 00:00:00')
        const endAt = new Date(String(updatedAt.getFullYear() + 1) + '-01-01 00:00:00')
        await sync(updatedAt, endAt)
      }
    } else {
      const endAt = new Date(String(new Date().getFullYear() + 1) + '-01-01 00:00:00') // 结束明年1月1日
      await sync(updatedAt, endAt)
    }
    // 更新商品条码信息
    await BarCodes.findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    }).then(res => {
      updatedAt = res ? res.updatedAt : new Date('2004')
    })
    const syncBarcode = async(updatedAt, endAt) => {
      await SQLBarcode.List(updatedAt, endAt).then(async response => {
        let barCodes = []
        if (response) {
          response.forEach(item => {
            barCodes.push({
              pluCode: item.pluCode,
              barCode: item.barCode,
              name: item.name,
              spec: item.spec,
              updatedAt: item.updatedAt
            })
          })
          await BarCodes.bulkCreate(barCodes,
            { updateOnDuplicate: ['pluCode', 'name', 'spec', 'updatedAt'] }
          ).then(() => {
            Message({
              showClose: true,
              message: parseTime(updatedAt) + ' - ' + parseTime(endAt) + ' 商品条码信息同步成功',
              type: 'success'
            })
          }).catch(error => {
            reject(new Error('插入商品条码失败:' + error.message))
          })
          barCodes = []
        }
      }).catch(error => {
        reject(new Error('查询商品条码失败:' + error.message))
      })
    }
    if (enforce) { // 强制执行时更新所有商品信息
      updatedAt = new Date('2016')
    }
    // const CurrentDate = new Date().getFullYear()
    if (updatedAt.getFullYear() < CurrentDate) {
      for (let index = updatedAt.getFullYear(); index <= CurrentDate; index++) {
        updatedAt = new Date(index + '-01-01 00:00:00')
        const endAt = new Date(String(updatedAt.getFullYear() + 1) + '-01-01 00:00:00')
        await syncBarcode(updatedAt, endAt)
      }
    } else {
      const endAt = new Date(String(new Date().getFullYear() + 1) + '-01-01 00:00:00') // 结束明年1月1日
      await syncBarcode(updatedAt, endAt)
    }
    resolve()
  })
}

