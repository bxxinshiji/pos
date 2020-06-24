
import Goods from '@/model/goods'
import { EAN13 } from '@/utils/barcode'
import log from '@/utils/log'

const hander = {
  addGoods(value, isPlucode) { // 添加商品  type 代码类型 条形码、自编码
    this.getGoods(value, isPlucode).then(goods => {
      if (goods) {
        // 默认没有商品数量没有总价时 商品数量为1
        if (!goods.dataValues.number && !goods.dataValues.total) {
          goods.dataValues.number = 1
        }
        goods.dataValues.total = goods.dataValues.number * goods.dataValues.price
        log.scope('inventory.goods.addGoods').info(JSON.stringify(goods.dataValues))
        this.$refs.goods.addGoods(goods.dataValues)
      } else {
        this.MessageBox({
          title: '未找到商品',
          message: '商品: ' + value + ' 信息不存在, 请重试。'
        })
      }
    }).catch(error => {
      this.MessageBox({
        title: '条码错误',
        message: error
      })
    })
  },
  getBarcodeGoods(value) { // 通过条形码获取商品
    return new Promise((resolve, reject) => {
      const barcode = EAN13.Decode(value)
      if (barcode.check) { // 校验条码
        if (barcode.custom) { // 是否为自定义条码(称重类)
          Goods.plucodeByGoods(barcode.goods.pluCode).then(goods => {
            if (goods) {
              goods.dataValues.total = barcode.goods.total
            }
            resolve(goods)
          }).catch(error => {
            reject(error)
          })
        } else {
          Goods.barcodeByGoods(value).then(goods => { // 条码获取商品
            resolve(goods)
          }).catch(error => {
            reject(error)
          })
        }
      } else {
        reject(new Error(value + ' 条形码校验失败'))
      }
    })
  },
  getPlucodeGoods(value) { // 通过条形码获取商品
    return new Promise((resolve, reject) => {
      Goods.plucodeByGoods(value).then(goods => { // plu获取商品
        resolve(goods)
      }).catch(error => {
        reject(error)
      })
    })
  },
  getGoods(value, isPlucode) {
    if (isPlucode) { // 允许输入
      if (/^(\d{13})$/.test(value)) {
        return this.getBarcodeGoods(value)
      } else {
        return this.getPlucodeGoods(value)
      }
    } else {
      return this.getBarcodeGoods(value)
    }
  }
}
export default hander
