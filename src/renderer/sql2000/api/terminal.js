import Terminal from '@/sql2000/model/terminal'
import store from '@/store'
import { SyncPlu } from '@/sql2000/api/goods'
import { SyncUser } from '@/sql2000/api/user'
import { SyncPay } from '@/sql2000/api/pay'
import { Loading } from 'element-ui'
/**
 * SyncTerminal 同步终端数据
 * @ 检测数据状态
 * @ 根据终端状态启动数据同步
 * @ 默认 30 秒 更新一次 path src/renderer/App.vue
 */
export async function SyncTerminal() {
  Terminal.PosCode = store.state.settings.terminal
  store.dispatch('terminal/handerSyncTerminal', false) // 关闭自动同步

  if (Terminal.PosCode) {
    await Terminal.Get()
    let status = 0 // 等待窗口锁
    // 更新用户信息
    if (Terminal.IsChgUser === '1') {
      status++
      const loadingInstance = Loading.service({
        text: '更新用户信息中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      await SyncUser().then(() => {
        Terminal.IsChgUser = '0'
        Terminal.Save()
        loadingInstance.text = '用户信息更新完成'
        setTimeout(() => {
          status--
          if (status === 0) {
            loadingInstance.close()
          }
        }, 1000)
      }).catch(error => {
        console.log(error)
      })
    }
    // 更新商品信息
    if (Terminal.IsChgPlu === '1') {
      status++
      const loadingInstance = Loading.service({
        text: '更新商品信息中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      await SyncPlu().then(() => {
        Terminal.IsChgPlu = '0'
        Terminal.Save()
        loadingInstance.text = '商品信息更新完成'
        setTimeout(() => {
          status--
          if (status === 0) {
            loadingInstance.close()
          }
        }, 1000)
      }).catch(error => {
        console.log(error)
      })
    }
    // 更新支付信息
    if (Terminal.IsChgZfKind === '1') {
      status++
      const loadingInstance = Loading.service({
        text: '更新支付信息中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      await SyncPay().then(() => {
        Terminal.IsChgZfKind = '0'
        Terminal.Save()
        loadingInstance.text = '支付信息更新完成'
        setTimeout(() => {
          status--
          if (status === 0) {
            loadingInstance.close()
          }
        }, 1000)
      }).catch(error => {
        console.log(error)
      })
    }
    store.dispatch('terminal/handerSyncTerminal', true) // 开启自动同步
    Terminal.UserName = store.getters.name
    Terminal.UserCode = store.getters.username
    Terminal.PosState = '10'
    Terminal.Save()
  }
}
