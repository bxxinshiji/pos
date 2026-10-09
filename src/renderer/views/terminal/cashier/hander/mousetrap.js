
import { registerShortcuts, unregisterShortcuts } from '@/utils/keyboardShortcuts'
import { Message } from 'element-ui'
import store from '@/store'
import hander from './hander'
import log from '@/utils/log'

const mousetrap = {
  registerMousetrap() {
    const Keyboard = store.state.settings.Keyboard
    const bindings = Object.create(null)
    Object.keys(Keyboard).forEach(key => {
      if (hander.hasOwnProperty(key) && Keyboard[key]) { // 只注册已配置的收银操作
        bindings[Keyboard[key]] = async() => {
          if (store.state.terminal.isPay) { // 支付中禁止操作
            Message({
              type: 'warning',
              message: '支付锁定中,请勿进行其他操作!'
            })
          } else {
            if (this.order.status) { // 根据订单状态初始化订单
              await this.initOrder()
            }
            log.h('info', 'Mousetrap.bindGlobal', JSON.stringify(key), Keyboard[key])
            setTimeout(() => {
              hander[key](this)
            }, 0)// 加入js队列[等待其他异步操作完成后在执行]
          }
        }
      }
    })
    registerShortcuts(this, bindings)
  },
  unregisterMousetrap() {
    unregisterShortcuts(this)
  }
}
export default mousetrap
