/**
 * require.js 模块引用类
 */
export default {
  modules: {
  },
  get(module) { // 加载指定模块
    if (!this.modules.hasOwnProperty(module)) {
      switch (module) {
        case 'fs':
          this.modules[module] = require('fs')
          break
        case 'path':
          this.modules[module] = require('path')
          break
        case 'electron-log':
          this.modules[module] = require('electron-log')
          break
        case 'electron':
          this.modules[module] = require('electron')
          break
      }
    }
    return this.modules[module]
  },
  resolveExePath(exePath, fileName) { // 获取程序根目录下指定目录的文件
    return this.get('path').join(this.exePath(exePath), fileName)
  },
  exePath(paths = '') { // 获取程序指定目录
    // 递归创建目录 同步方法
    const mkdirsSync = (dirname) => {
      if (this.get('fs').existsSync(dirname)) {
        return true
      } else {
        if (mkdirsSync(this.get('path').dirname(dirname))) {
          this.get('fs').mkdirSync(dirname)
          return true
        }
      }
    }
    const dataPath = this.get('path').join(this.get('electron').remote.app.getPath('exe'), '../', paths)
    mkdirsSync(dataPath, 777)
    return dataPath
  }
}
