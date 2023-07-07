
import store from '@/store'
const barcodeReg = store.state.settings.barcodeReg
const EAN = {
  reg: barcodeReg, // 条码识别规则
  code: '',
  checksum: '', // 获取校验位
  check: false, // 检测条码是否合格
  custom: false, // 自定义条码:是否是自定义称重条码
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
  checksums(code) {
    this.code = code
    const res = code
      .substr(0, 12)
      .split('')
      .map((n) => +n)
      .reduce((sum, a, idx) => (
        idx % 2 ? sum + a * 3 : sum + a
      ), 0)
    this.checksum = (10 - (res % 10)) % 10
    return this
  },
  // 检测是否合格
  checks(code, c = 12) {
    if (code.length === 8) { // EAN-8
      code = '00000' + code
    }
    if (code.length === 11) { // UPC-A
      code = '06' + code
    }
    if (code.length === 12) { // PC-E
      code = '0' + code
    }
    // EAN-13
    this.check = Number(this.checksums(code).checksum) === Number(code[c])
    return this
  },
  init() {
    this.checksum = '' // 获取校验位
    this.check = false // 检测条码是否合格
    this.custom = false // 自定义条码:是否是自定义称重条码
    this.goods = {
      serial: '', // 自定义条码: 货号
      pluCode: '', // 自定义条码: PLU号
      total: 0, // 自定义条码: 总价
      price: 0, // 自定义条码: 单价
      number: 0 // // 自定义条码: 重量或数量
    }
  },
  // 自定义条码解析
  Decode(code) {
    code = String(code)
    this.init() // 初始化数据
    if (!this.checks(code).check) { // 不合格返回
      return this
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
    if (code[0] + code[1] === this.reg[0] + this.reg[1]) {
      this.custom = true
      // 初始化商品数据
      this.goods = {
        pluCode: '', // 自定义条码: PLU号
        total: 0, // 自定义条码: 总价
        price: 0, // 自定义条码: 单价
        serial: '', // 自定义条码: 货号
        number: 0 // // 自定义条码: 重量或数量
      }
      this.reg.split('')
        .map((value, idx) => {
          switch (value) {
            case 'A':
              this.goods.serial = this.goods.serial + code[idx]
              break
            case 'P':
              this.goods.pluCode = this.goods.pluCode + code[idx]
              break
            case 'B':
              this.goods.total = Number(this.goods.total + code[idx])
              break
            case 'Q':
              this.goods.number = Number(this.goods.number + code[idx])
              break
            case 'U':
              this.goods.price = Number(this.goods.price + code[idx])
              break
            default:
              break
          }
        })
    }
    return this
  }
}
export { EAN }
