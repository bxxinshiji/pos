import log from 'electron-log'
import store from '@/store'
import { exePath } from '@/utils'
var path = require('path')
// // 日志文件等级，默认值：false
// log.transports.file.level = 'debug'
// // 日志控制台等级，默认值：false 'debug'全部显示
log.transports.console.level = 'error'
// 日志大小
log.transports.file.maxSize = store.state.settings.log * 1024 * 1024 // 100m
log.fileName = 'main.log'
// 日志路径
// 日志文件名，默认：main.log
log.transports.file.resolvePath = () => {
  return path.join(exePath('log'), log.fileName)
}
log.h = async(type, scope, message) => {
  switch (type) {
    case 'error':
      log.scope(scope).error(message)
      break
    case 'warn':
      log.scope(scope).warn(message)
      break
    case 'info':
      log.scope(scope).info(message)
      break
    case 'verbose':
      log.scope(scope).verbose(message)
      break
    case 'debug':
      log.scope(scope).debug(message)
      break
    case 'silly':
      log.scope(scope).silly(message)
      break
    default:
      log.scope(scope).info(message)
      break
  }
}
export default log
