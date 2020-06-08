const init = require('escpos')
init.USB = require('escpos-usb')
// init.Bluetooth = require('escpos-bluetooth')
init.Serial = require('escpos-serialport')
init.Network = require('escpos-network')
init.Console = require('escpos-console')
import store from '@/store'
const config = store.state.settings.printer

const escpos = {
  devicer: {},
  printer: {},
  init() {
    var device = config.device
    var deviceConfig = ''
    var options = { encoding: 'GB18030' /* default */ }
    let devicer = {}
    switch (device) { // 设置驱动
      case 'USB':
        devicer = new init.USB(deviceConfig)
        break
      case 'Serial':
        devicer = new init.Serial(deviceConfig)
        break
      // case 'Bluetooth':
      //   devicer = new init.Bluetooth(deviceConfig)
      //   break
      case 'Network':
        devicer = new init.Network(deviceConfig)
        break
      case 'Console':
        devicer = new init.Console()
        break
    }
    escpos.devicer = devicer
    escpos.printer = new init.Printer(devicer, options) // 初始化打印机
  },
  print(data) {
    return new Promise((resolve, reject) => {
      if (config.switch) {
        try {
          escpos.init()
          const devicer = escpos.devicer
          const printer = escpos.printer
          devicer.open(function() {
            data.forEach(item => {
              switch (item.type) {
                case 'text':
                  printer.text(item.contents)
                  break
                case 'centerText':
                  printer.align('ct').size(2, 2).text(item.contents).align('lt').size(1, 1)
                  break
                case 'barcode':
                  printer.align('CT').barcode(item.contents, 'code39', {
                    height: 50
                  }).align('LT')
                  break
              }
            })
            printer.cut().close() // 切纸、关闭
          })
          resolve()
        } catch (err) {
          reject(err)
        }
      } else {
        reject(new Error('打印机未开启'))
      }
    })
  },
  cashdraw() { // 开钱箱
    return new Promise((resolve, reject) => {
      try {
        escpos.init()
        const devicer = escpos.devicer
        const printer = escpos.printer
        devicer.open(function() {
          printer.cashdraw()
          printer.cut().close() // 切纸、关闭
        })
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }
}
export default escpos
