
import store from '@/store'

import Goods from '@/model/goods'
import { EAN13 } from '@/utils/barcode'
import log from '@/utils/log'

const hander = {
  addGoods(value, isPlucode) { // 添加商品  type 代码类型 条形码、自编码
    if (this.order.pays.length > 0) {
      this.MessageBox({
        title: '添加商品失败',
        message: '付款流程中禁止添加商品。'
      })
      return
    }
    this.lockGoods = true
    this.getGoods(value, isPlucode).then(goods => {
      if (goods) {
        const status = goods.snapshot.status
        if (status === '2' || status === '3' || status === '4' || status === 'A' || status === 'B') {
          this.MessageBox({
            title: '商品禁止销售',
            message: '商品: ' + value + ' 已被管理员禁止销售,请联系管理员。'
          })
          log.scope('cashier.item.addGoods').error(JSON.stringify('商品: ' + value + ' 已被管理员禁止销售,请联系管理员。'))
          this.lockGoods = false // 添加商品解锁
          return
        }
        // 默认没有商品数量没有总价时 商品数量为1
        if (!goods.dataValues.number && !goods.dataValues.total) {
          goods.dataValues.number = 1
        }
        // 允许自定义价格商品 并且没有总价时 手动输入商品总价
        if (goods.dataValues.type && !goods.dataValues.total) { // 缓存手动输入价格商品
          store.dispatch('terminal/changeIsInputPrice', true)
          store.dispatch('terminal/changeCacheGoods', goods)
        } else {
          this.$refs.goods.addGoods(goods.dataValues)
          this.lockGoods = false // 添加商品解锁
        }
      } else {
        this.MessageBox({
          title: '未找到商品',
          message: '商品: ' + value + ' 信息不存在, 请重试。'
        })
        log.scope('cashier.item.addGoods').error(JSON.stringify('商品: ' + value + ' 信息不存在, 请重试。'))
        this.lockGoods = false // 添加商品解锁
        return
      }
    }).catch(error => {
      this.MessageBox({
        title: '条码错误',
        message: error
      })
      log.scope('cashier.item.addGoods').error(JSON.stringify(error.message))
      this.lockGoods = false // 添加商品解锁
      return
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
