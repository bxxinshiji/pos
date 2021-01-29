import store from '@/store'
import config from '@/sql2000/model/config'

// 同步系统配置
export function SyncSysConfig() {
  return new Promise((resolve, reject) => {
    config.Get('SetVipRemoteSvrName').then(response => {
      store.dispatch('settings/changeSetting', { key: 'cardRemoteSQL2000Host', value: response[0].OptValue })
    }).catch(error => {
      reject(new Error('查询会员卡远程服务器地址:' + error.message))
    })
    config.Get('SetVipRemoteUserCode').then(response => {
      store.dispatch('settings/changeSetting', { key: 'cardRemoteSQL2000Username', value: response[0].OptValue })
    }).catch(error => {
      reject(new Error('查询会员卡远程服务器用户名:' + error.message))
    })
    config.Get('SetVipRemotePassword').then(response => {
      store.dispatch('settings/changeSetting', { key: 'cardRemoteSQL2000Password', value: response[0].OptValue })
    }).catch(error => {
      reject(new Error('查询会员卡远程服务器密码:' + error.message))
    })
    config.Get('SetVipRemoteDBName  ').then(response => {
      store.dispatch('settings/changeSetting', { key: 'cardRemoteSQL2000database', value: response[0].OptValue })
    }).catch(error => {
      reject(new Error('查询会员卡远程服务器数据表明:' + error.message))
    })
    config.Get('setshopcode  ').then(response => {
      store.dispatch('settings/changeSetting', { key: 'shopCode', value: response[0].OptValue })
    }).catch(error => {
      reject(new Error('查询店铺编码:' + error.message))
    })

    console.log(store)
    resolve()
  })
}
