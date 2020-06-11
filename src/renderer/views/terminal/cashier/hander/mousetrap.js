
const Mousetrap = require('mousetrap')
// require('@/utils/mousetrap-global-bind')
import { Message } from 'element-ui'
import store from '@/store'
const Keyboard = store.state.settings.Keyboard
import hander from './hander'

const mousetrap = {
  registerMousetrap() {
    Object.keys(Keyboard).map(key => {
      if (hander.hasOwnProperty(key)) { // 方式不存在的方法注册
        Mousetrap.bindGlobal(Keyboard[key].toLowerCase(), () => {
          if (store.state.terminal.isPay) { // 支付中禁止操作
            Message({
              type: 'warning',
              message: '支付锁定中,请勿进行其他操作!'
            })
          } else {
            if (this.order.status) { // 根据订单状态初始化订单
              this.initOrder()
            } else {
              hander[key](this)
            }
          }
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
