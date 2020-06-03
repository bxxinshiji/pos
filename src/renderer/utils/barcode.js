
import store from '@/store'
const barcodeReg = store.state.settings.barcodeReg
const EAN13 = {
  reg: barcodeReg, // 条码识别规则
  code: '',
  checksum: '', // 获取校验位
  check: false, // 检测条码是否合格

  custom: false, // 自定义条码:是否是自定义条码
  goods: {
    serial: '', // 自定义条码: 货号
    pluCode: '', // 自定义条码: PLU号
    total: 0, // 自定义条码: 总价
    price: 0, // 自定义条码: 单价
    number: 0 // // 自定义条码: 重量或数量
  },
  // Calculate the checksum digit
  // https://en.wikipedia.org/wiki/International_Article_Number_(EAN)#Calculation_of_checksum_digit
  // 获取校验位
  checksums: (code) => {
    EAN13.code = code
    const res = code
      .substr(0, 12)
      .split('')
      .map((n) => +n)
      .reduce((sum, a, idx) => (
        idx % 2 ? sum + a * 3 : sum + a
      ), 0)
    EAN13.checksum = (10 - (res % 10)) % 10
    return EAN13
  },
  // 检测是否合格
  checks: (code, c = 12) => {
    EAN13.check = Number(EAN13.checksums(code).checksum) === Number(code[c])
    return EAN13
  },
  // 自定义条码解析
  Decode: (code) => {
    EAN13.custom = false // 默认非称重类类条码
    if (!EAN13.checks(code).check) { // 不合格返回
      return EAN13
    }
    /**
     * reg
     * F 自定义前缀(27必须前两位)
     * A 货物
     * P PLU号
     * B 总价
     * Q 重量或数量
     * U 单价
     * C 校验位
     */
    // 称重类条形码
    if (code[0] + code[1] === EAN13.reg[0] + EAN13.reg[1]) {
      EAN13.custom = true
      // 初始化商品数据
      EAN13.goods = {
        pluCode: '', // 自定义条码: PLU号
        total: 0, // 自定义条码: 总价
        price: 0, // 自定义条码: 单价
        serial: '', // 自定义条码: 货号
        number: 0 // // 自定义条码: 重量或数量
      }
      EAN13.reg.split('')
        .map((value, idx) => {
          switch (value) {
            case 'A':
              EAN13.goods.serial = EAN13.goods.serial + code[idx]
              break
            case 'P':
              EAN13.goods.pluCode = EAN13.goods.pluCode + code[idx]
              break
            case 'B':
              EAN13.goods.total = Number(EAN13.goods.total + code[idx])
              break
            case 'Q':
              EAN13.goods.number = Number(EAN13.goods.number + code[idx])
              break
            case 'U':
              EAN13.goods.price = Number(EAN13.goods.price + code[idx])
              break
            default:
              break
          }
        })
    }
    return EAN13
  }
}
export { EAN13 }
