const Sequelize = require('sequelize')
import { Loading } from 'element-ui'
import connection from '@/sql2000/model/connection'
import { trim, parseTime } from '@/utils'
const pool = connection.Pool()
import store from '@/store'
// 删除字符串两边空格
function handerItem(item) {
  Object.keys(item).forEach(key => {
    if (typeof item[key] === 'string') {
      item[key] = trim(item[key])
    }
  })
}
const terminal = {
  PosCode: '',
  loadingInstance: '',
  // 获取终端状态信息
  Get() {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`
        select * from tXsPos WHERE PosCode=:PosCode
      `,
      { replacements: { PosCode: terminal.PosCode }, type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        const macAddress = store.state.settings.macAddress
        const item = response[0]
        if (trim(item.PosName) !== trim(macAddress)) {
          this.loadingInstance = Loading.service({
            text: '终端:' + terminal.PosCode + ' 请到后台绑定终端网卡地址: ' + macAddress,
            background: 'rgba(0, 0, 0, 0.7)'
          })
          return
        }
        if (item.IsEnable === '0') {
          this.loadingInstance = Loading.service({
            text: '终端状态未开启',
            background: 'rgba(0, 0, 0, 0.7)'
          })
          return
        }
        if (this.loadingInstance) {
          this.loadingInstance.close()
        }
      }).catch(error => {
        reject(error)
      })
      pool.DB.query(`
        select * from tXsPosState WHERE PosCode=:PosCode
      `,
      { replacements: { PosCode: terminal.PosCode }, type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        const item = response[0]
        handerItem(item)
        // terminal.CurrVer = item.CurrVer
        terminal.DlDate = item.DlDate
        terminal.IsBroadCast = item.IsBroadCast
        terminal.IsCheckMode = item.IsCheckMode
        terminal.IsChgCalDef = item.IsChgCalDef
        terminal.IsChgCls = item.IsChgCls
        terminal.IsChgDep = item.IsChgDep
        terminal.IsChgExe = item.IsChgExe
        terminal.IsChgIni = item.IsChgIni
        terminal.IsChgKeyDef = item.IsChgKeyDef
        terminal.IsChgPlu = item.IsChgPlu
        terminal.IsChgReason = item.IsChgReason
        terminal.IsChgUser = item.IsChgUser
        terminal.IsChgVip = item.IsChgVip
        terminal.IsChgVipPrice = item.IsChgVipPrice
        terminal.IsChgZfKind = item.IsChgZfKind
        terminal.IsPosJz = item.IsPosJz
        terminal.IsUsed = item.IsUsed
        // terminal.JzBgnDate = item.JzBgnDate
        terminal.JzDate = item.JzDate
        // terminal.JzEndDate = item.JzEndDate
        terminal.JzStatus = item.JzStatus
        // terminal.LastChgDate = item.LastChgDate
        terminal.PosCode = item.PosCode
        terminal.PosState = item.PosState
        terminal.PreJzDate = item.PreJzDate
        terminal.UserCode = item.UserCode
        terminal.UserName = item.UserName
        terminal.ZxDate = item.ZxDate
        resolve(terminal)
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 保存终端信息
  Save() {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`UPDATE tXsPosState SET 
        DlDate='` + parseTime(terminal.DlDate, '{y}-{m}-{d} {h}:{i}:{s}.{n}') + `',
        IsBroadCast='` + terminal.IsBroadCast + `',
        IsCheckMode='` + terminal.IsCheckMode + `',
        IsChgCalDef='` + terminal.IsChgCalDef + `',
        IsChgCls='` + terminal.IsChgCls + `',
        IsChgDep='` + terminal.IsChgDep + `',
        IsChgExe='` + terminal.IsChgExe + `',
        IsChgIni='` + terminal.IsChgIni + `',
        IsChgKeyDef='` + terminal.IsChgKeyDef + `',
        IsChgPlu='` + terminal.IsChgPlu + `',
        IsChgReason='` + terminal.IsChgReason + `',
        IsChgUser='` + terminal.IsChgUser + `',
        IsChgVip='` + terminal.IsChgVip + `',
        IsChgVipPrice='` + terminal.IsChgVipPrice + `',
        IsChgZfKind='` + terminal.IsChgZfKind + `',
        IsPosJz='` + terminal.IsPosJz + `',
        IsUsed='` + terminal.IsUsed + `',
        JzDate='` + parseTime(terminal.JzDate, '{y}-{m}-{d} {h}:{i}:{s}.{n}') + `',
        JzStatus='` + terminal.JzStatus + `',
        PosState='` + terminal.PosState + `',
        PreJzDate='` + parseTime(terminal.PreJzDate, '{y}-{m}-{d} {h}:{i}:{s}.{n}') + `',
        UserCode='` + terminal.UserCode + `',
        UserName='` + terminal.UserName + `',
        ZxDate='` + parseTime(terminal.ZxDate, '{y}-{m}-{d} {h}:{i}:{s}.{n}') + `'
        WHERE PosCode='` + terminal.PosCode + `'
      `,
      { type: Sequelize.QueryTypes.SELECT }
      ).then((response) => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default terminal
