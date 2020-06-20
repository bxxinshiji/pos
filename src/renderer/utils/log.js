import log from 'electron-log'
var path = require('path')
import { exePath } from '@/utils'
// // 日志文件等级，默认值：false
// log.transports.file.level = 'debug'
// // 日志控制台等级，默认值：false 'debug'全部显示
log.transports.console.level = 'error'
// 日志大小
log.transports.file.maxSize = 100 * 1024 * 1024 // 100m
// 日志路径
// 日志文件名，默认：main.log
log.transports.file.resolvePath = () => {
  return path.join(exePath('log'), 'main.log')
}

export default log
