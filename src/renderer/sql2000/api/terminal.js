import Terminal from '@/sql2000/model/terminal'
import store from '@/store'
import { SyncPlu } from '@/sql2000/api/goods'
import { SyncUser } from '@/sql2000/api/user'
import { SyncPay } from '@/sql2000/api/pay'
import { Loading } from 'element-ui'
import log from '@/utils/log'
/**
 * SyncTerminal 同步终端数据
 * @ 检测数据状态
 * @ 根据终端状态启动数据同步
 * @ 默认 30 秒 更新一次 path src/renderer/App.vue
 */
export async function SyncTerminal(enforce = false) {
  try {
    Terminal.PosCode = store.state.settings.terminal
    if (Terminal.PosCode) {
      store.dispatch('terminal/handerSyncTerminal', false) // 关闭自动同步
      await Terminal.Get().catch(error => {
        log.h('error', 'Terminal.Get', JSON.stringify(error.message))
      })
      let status = 0 // 等待窗口锁
      // 更新用户信息
      if (Terminal.IsChgUser === '1' || enforce) {
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
          log.h('error', 'ChgUser', JSON.stringify(error.message))
        })
      }
      // 更新商品信息
      if (Terminal.IsChgPlu === '1' || enforce) {
        status++
        const loadingInstance = Loading.service({
          text: '更新商品信息中...',
          background: 'rgba(0, 0, 0, 0.7)'
        })
        store.dispatch('terminal/emptyCacheInputGoods')
        await SyncPlu(enforce).then(() => {
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
          log.h('error', 'ChgPlu', JSON.stringify(error.message))
        })
      }
      // 更新支付信息
      if (Terminal.IsChgZfKind === '1' || enforce) {
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
          log.h('error', 'ZfKind', JSON.stringify(error.message))
        })
      }
      store.dispatch('terminal/handerSyncTerminal', true) // 开启自动同步
      Terminal.DlDate = new Date()
      Terminal.UserName = store.getters.name
      Terminal.UserCode = store.getters.username
      Terminal.PosState = '10'
      Terminal.Save()
    }
  } catch (error) {
    log.h('error', 'try', JSON.stringify(error.message))
    store.dispatch('terminal/handerSyncTerminal', true) // 开启自动同步
  }
}
