
const Mousetrap = require('mousetrap')
require('@/utils/mousetrap-global-bind')
import store from '@/store'
const Keyboard = store.state.settings.Keyboard
import hander from './hander'
import log from '@/utils/log'

const mousetrap = {
  registerMousetrap() {
    Object.keys(Keyboard).map(key => {
      if (hander.hasOwnProperty(key)) { // 方式不存在的方法注册
        Mousetrap.bindGlobal(Keyboard[key].toLowerCase(), () => {
          if (this.order.status) { // 根据订单状态初始化订单
            this.initOrder()
          }
          log.h('info', 'inventory.Mousetrap.bindGlobal', JSON.stringify(key), Keyboard[key])
          hander[key](this)
        })
      }
    })
  },
  unregisterMousetrap() {
    Object.keys(Keyboard).map(key => { // 注销快捷键
      if (hander.hasOwnProperty(key)) { // 方式不存在的方法注销
        Mousetrap.unbindGlobal(Keyboard[key].toLowerCase())
      }
    })
  }
}
export default mousetrap
