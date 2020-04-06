import store from '@/store'
import { SyncTerminal as SQL2000SyncTerminal } from '@/sql2000/api/terminal'

import sequelize from '@/model/terminalUser'
const user = sequelize.models.terminalUser

export function Login(data) {
  return user.Auth(data)
}
// SyncTerminal 同步终端数据
export function SyncTerminal(data) {
  if (store.state.terminal.syncTerminal) {
    return SQL2000SyncTerminal(data)
  }
}

