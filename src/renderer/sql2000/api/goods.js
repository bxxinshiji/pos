// sync 同步数据
import SQLGoods from '@/sql2000/model/goods'
import SQLBarcode from '@/sql2000/model/barcode'
import { Message } from 'element-ui'
import { parseTime } from '@/utils/index'
const Goods = require('@/model/api/goods')

export async function SyncPlu(enforce = false) {
  return new Promise(async(resolve, reject) => {
    // 更新商品
    let updatedAt = new Date('2004')
    await Goods.findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    }).then(res => {
      updatedAt = res ? new Date(res.updatedAt.toLocaleDateString()) : new Date('2004')
    })
    const sync = async(updatedAt, endAt) => {
      await SQLGoods.List(updatedAt, endAt).then(async response => {
        const goods = []
        const barCodes = []
        if (response) {
          response.forEach(async item => {
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
              status: item.status,
              SupCode: item.SupCode,
              HJPrice: item.HJPrice,
              WJPrice: item.WJPrice,
              HyPrice: item.HyPrice,
              PfPrice: item.PfPrice,
              ClsCode: item.ClsCode,
              BrandCode: item.BrandCode,
              JTaxRate: item.JTaxRate,
              YhType: item.YhType,
              MgType: item.MgType,
              IsDecimal: item.IsDecimal,
              Tag: item.Tag,
              updatedAt: item.updatedAt
            })
            if (item.barCode) {
              barCodes.push({
                pluCode: item.pluCode,
                barCode: item.barCode,
                depCode: item.depCode,
                price: item.price,
                name: item.name,
                unit: item.unit,
                spec: item.spec,
                type: Number(item.type) ? 1 : 0, // [0普通商品 1称重商品 2 承受不定商品 3金额管理商品] 转成 0 1
                status: item.status,
                SupCode: item.SupCode,
                HJPrice: item.HJPrice,
                WJPrice: item.WJPrice,
                HyPrice: item.HyPrice,
                PfPrice: item.PfPrice,
                ClsCode: item.ClsCode,
                BrandCode: item.BrandCode,
                JTaxRate: item.JTaxRate,
                YhType: item.YhType,
                MgType: item.MgType,
                IsDecimal: item.IsDecimal,
                Tag: item.Tag,
                updatedAt: item.updatedAt
              })
            }
          })

          await Goods.bulkCreatePlu(goods, { updateOnDuplicate: [
            'barCode',
            'depCode',
            'price',
            'name',
            'unit',
            'spec',
            'type',
            'status',
            'SupCode',
            'HJPrice',
            'WJPrice',
            'HyPrice',
            'PfPrice',
            'ClsCode',
            'BrandCode',
            'JTaxRate',
            'YhType',
            'MgType',
            'IsDecimal',
            'Tag',
            'updatedAt'
          ] }).then(() => {
            Message({
              showClose: true,
              message: parseTime(updatedAt) + ' - ' + parseTime(endAt) + ' 商品同步成功',
              type: 'success'
            })
          }).catch(error => {
            reject(new Error('插入商品PLU失败:' + error.message))
          })
          await Goods.bulkCreateBar(barCodes, {
            updateOnDuplicate: [
              'barCode',
              'depCode',
              'price',
              'name',
              'unit',
              'spec',
              'type',
              'status',
              'SupCode',
              'HJPrice',
              'WJPrice',
              'HyPrice',
              'PfPrice',
              'ClsCode',
              'BrandCode',
              'JTaxRate',
              'YhType',
              'MgType',
              'IsDecimal',
              'Tag',
              'updatedAt'
            ]
          }).then(() => {
            Message({
              showClose: true,
              message: parseTime(updatedAt) + ' - ' + parseTime(endAt) + ' 条码商品同步成功',
              type: 'success'
            })
          }).catch(error => {
            reject(new Error('插入条码商品失败:' + error.message))
          })
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
    await Goods.findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    }).then(res => {
      updatedAt = res ? new Date(res.updatedAt.toLocaleDateString()) : new Date('2004')
    })
    const syncBarcode = async(updatedAt, endAt) => {
      await SQLBarcode.List(updatedAt, endAt).then(async response => {
        const barCodes = []
        if (response) {
          response.forEach(item => {
            item.price = Math.round(item.price * 100)
            barCodes.push({
              pluCode: item.pluCode,
              barCode: item.barCode,
              depCode: item.depCode,
              price: item.price,
              name: item.name,
              unit: item.unit,
              spec: item.spec,
              type: Number(item.type) ? 1 : 0, // [0普通商品 1称重商品 2 承受不定商品 3金额管理商品] 转成 0 1
              status: item.status,
              SupCode: item.SupCode,
              HJPrice: item.HJPrice,
              WJPrice: item.WJPrice,
              HyPrice: item.HyPrice,
              PfPrice: item.PfPrice,
              ClsCode: item.ClsCode,
              BrandCode: item.BrandCode,
              JTaxRate: item.JTaxRate,
              YhType: item.YhType,
              MgType: item.MgType,
              IsDecimal: item.IsDecimal,
              Tag: item.Tag,
              updatedAt: item.updatedAt
            })
          })
          await Goods.bulkCreateBar(barCodes,
            { updateOnDuplicate: [
              'barCode',
              'depCode',
              'price',
              'name',
              'unit',
              'spec',
              'type',
              'status',
              'SupCode',
              'HJPrice',
              'WJPrice',
              'HyPrice',
              'PfPrice',
              'ClsCode',
              'BrandCode',
              'JTaxRate',
              'YhType',
              'MgType',
              'IsDecimal',
              'Tag',
              'updatedAt'
            ] }
          ).then(() => {
            Message({
              showClose: true,
              message: parseTime(updatedAt) + ' - ' + parseTime(endAt) + ' 商品条码信息同步成功',
              type: 'success'
            })
          }).catch(error => {
            reject(new Error('插入商品条码失败:' + error.message))
          })
        }
      }).catch(error => {
        reject(new Error('查询商品条码失败:' + error.message))
      })
    }
    if (enforce) { // 强制执行时更新所有商品信息
      updatedAt = new Date('2004')
    }
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
