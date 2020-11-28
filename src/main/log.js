
import log from 'electron-log'
import electron from 'electron'
import fs from 'fs'
import path from 'path'

const exePath = (paths = '') => { // 获取程序指定目录
  // 递归创建目录 同步方法
  const mkdirsSync = (dirname) => {
    if (fs.existsSync(dirname)) {
      return true
    } else {
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
  }
  const dataPath = path.join(electron.app.getPath('exe'), '../', paths)
  mkdirsSync(dataPath, 777)
  return dataPath
}
const resolveExePath = (paths, fileName) => { // 获取程序根目录下指定目录的文件
  return path.join(exePath(paths), fileName)
}
// // 日志文件等级，默认值：false
// log.transports.file.level = 'debug'
// // 日志控制台等级，默认值：false 'debug'全部显示
log.transports.console.level = 'error'
// 日志大小
log.transports.file.maxSize = 10 * 1024 * 1024 // 100m
log.fileName = 'process.log'
// 日志路径
// 日志文件名，默认：main.log
const resolvePath = resolveExePath('log', log.fileName)
log.transports.file.resolvePath = () => {
  return resolvePath
}
log.h = async(type, scope, message) => {
  message = JSON.parse(JSON.stringify(message))
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
