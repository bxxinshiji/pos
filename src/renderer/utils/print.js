import { formatStr } from '@/utils/index'
import escpos from '@/utils/escpos'
import store from '@/store'
const config = store.state.settings.printer

const goodsHander = (goodsExp, goods) => {
  var show = ''
  goodsExp = goodsExp.replace(/{{\s*goods\(/, '')
  goodsExp = goodsExp.replace(/\)}}/, '')
  goodsExp = goodsExp.split(',')
  goods.forEach(item => {
    goodsExp.forEach(regExp => {
      const reg = regExp.split('|')
      switch (reg[0]) {
        case 'pluCode':
          show = show + formatStr(item.pluCode, reg[1], false) + ' '
          break
        case 'name':
          show = show + formatStr(item.name, reg[1]) + ' '
          break
        case 'number':
          show = show + formatStr((item.number).toFixed(2), reg[1], false) + ' '
          break
        case 'price':
          show = show + formatStr((item.price / 100).toFixed(2), reg[1], false) + ' '
          break
        case 'total':
          show = show + formatStr((item.total / 100).toFixed(2), reg[1], false) + ' '
          break
      }
    })
    show = show.substr(0, show.length - 1) // 删除最后的空格
    show = show + `\n` // 每行添加回车
  })
  return show.substr(0, show.length - 2) // 删除最后一行回车
}
const paysHander = (paysExp, pays) => {
  var show = ''
  paysExp = paysExp.replace(/{{\s*pays\(/, '')
  paysExp = paysExp.replace(/\)}}/, '')
  paysExp = paysExp.split(',')
  pays.forEach(item => {
    paysExp.forEach(regExp => {
      const reg = regExp.split('|')
      switch (reg[0]) {
        case 'name':
          show = show + formatStr(item.name, reg[1]) + ' '
          break
        case 'amount':
          show = show + formatStr((item.amount / 100).toFixed(2), reg[1], false) + ' '
          break
        case 'getAmount':
          show = show + formatStr((item.getAmount / 100).toFixed(2), reg[1], false) + ' '
          break
      }
    })
    show = show.substr(0, show.length - 1) // 删除最后的空格
    show = show + `\n` // 每行添加回车
  })
  return show.substr(0, show.length - 2) // 删除最后一行回车
}
const barcodeHander = (barcodeExp, order) => {
  barcodeExp = barcodeExp.replace(/{{\s*barcode\(/, '')
  barcodeExp = barcodeExp.replace(/\)}}/, '')
  return order[barcodeExp] ? order[barcodeExp] : barcodeExp
}
const centerTextHander = (textExp, order) => {
  textExp = textExp.replace(/{{\s*centerText\(/, '')
  textExp = textExp.replace(/\)}}/, '')
  return order[textExp] ? order[textExp] : textExp
}
const print = {
  switch() {
    return config.switch
  },
  contents: [],
  hander(order) {
    this.order(order)
    return new Promise((resolve, reject) => {
      escpos.print(this.contents, { device: 'USB' }).then(response => {
        resolve(response)
      }).catch(err => {
        reject(err)
      })
    })
  },
  order(order) { // 订单处理信息
    var contents = config.template.split('\n')
    contents = contents.map(element => {
      var type = 'text'
      if (/{{\s*centerText.*}}/.test(element)) {
        type = 'centerText'
        const textExp = element.match(/{{\s*centerText.*}}/g)[0]
        element = element.replace(/{{\s*centerText.*}}/, centerTextHander(textExp, order))
      }
      if (/{{\s*barcode.*}}/.test(element)) {
        type = 'barcode'
        const barcodeExp = element.match(/{{\s*barcode.*}}/g)[0]
        element = element.replace(/{{\s*barcode.*}}/, barcodeHander(barcodeExp, order))
      }
      if (/{{\s*goods.*}}/.test(element)) {
        const goodsExp = element.match(/{{\s*goods.*}}/g)[0]
        element = element.replace(/{{\s*goods.*}}/, goodsHander(goodsExp, order.goods))
      }
      if (/{{\s*pays.*}}/.test(element)) {
        const paysExp = element.match(/{{\s*pays.*}}/g)[0]
        element = element.replace(/{{\s*pays.*}}/, paysHander(paysExp, order.pays))
      }
      element = element.replace(/{{\s*stuats\s*}}/g, order.type ? '销货' : '退货')

      element = element.replace(/{{\s*total\s*}}/g, (order.total / 100).toFixed(2))
      element = element.replace(/{{\s*userId}\s*}/g, order.userId)
      element = element.replace(/{{\s*terminal\s*}}/g, order.terminal)
      element = element.replace(/{{\s*orderNo\s*}}/g, order.orderNo)
      element = element.replace(/{{\s*createdAt\s*}}/g, order.createdAt)

      return {
        type,
        contents: element
      }
    })
    this.contents = contents

    return contents
  }
}
export default print
