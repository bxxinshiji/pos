
const Mousetrap = require('mousetrap')
// require('@/utils/mousetrap-global-bind')
import store from '@/store'
const Keyboard = store.state.settings.Keyboard
import hander from './hander'

const mousetrap = {
  registerMousetrap() {
    Object.keys(Keyboard).map(key => {
      if (hander.hasOwnProperty(key)) { // 方式不存在的方法注册
        Mousetrap.bindGlobal(Keyboard[key], () => {
          if (this.order.status) { // 根据订单状态初始化订单
            this.initOrder()
          } else {
            hander[key](this)
          }
        })
      }
    })
  },
  unregisterMousetrap() {
    Object.keys(Keyboard).map(key => { // 注销快捷键
      if (hander.hasOwnProperty(key)) { // 方式不存在的方法注销
        Mousetrap.unbindGlobal(Keyboard[key])
      }
    })
  }
}
export default mousetrap
