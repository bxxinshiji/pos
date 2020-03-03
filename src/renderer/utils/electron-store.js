import { exePath } from '@/utils'
const Store = require('electron-store')

export default new Store({
  cwd: exePath('config')// 设置配置文件程序根目录位置
})
