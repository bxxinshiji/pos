
import { registerShortcuts, unregisterShortcuts } from '@/utils/keyboardShortcuts'
import store from '@/store'
import hander from './hander'
import log from '@/utils/log'

const mousetrap = {
  registerMousetrap() {
    const Keyboard = store.state.settings.Keyboard
    const bindings = Object.create(null)
    Object.keys(Keyboard).forEach(key => {
      if (hander.hasOwnProperty(key) && Keyboard[key]) { // 只注册已配置的盘点操作
        bindings[Keyboard[key]] = async() => {
          if (this.order.status) { // 根据订单状态初始化订单
            await this.initOrder()
          }
          log.h('info', 'inventory.Mousetrap.bindGlobal', JSON.stringify(key), Keyboard[key])
          setTimeout(() => {
            hander[key](this)
          }, 0)// 加入js队列[等待其他异步操作完成后在执行]
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
