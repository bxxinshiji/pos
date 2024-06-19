'use strict'

import { app, BrowserWindow, Menu, dialog } from 'electron'
import log from './log'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow() {
  if (process.platform === 'darwin') {
    const template = [
      {
        label: '应用',
        submenu: [
          { label: '退出', accelerator: 'Command+Q', click: function() { app.quit() } }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { label: '剪切', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
          { label: '复制', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
          { label: '全选', accelerator: 'CommandOrControl+A', selector: 'selectAll:' }
        ]
      }
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  } else {
    Menu.setApplicationMenu(null)
  }
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    width: 1000,
    useContentSize: true,
    fullscreen: true,
    // frame: false, // 无边框窗口
    backgroundColor: '#303133', //
    webPreferences: {
      webSecurity: false, // 允许 electron 跨域
      nodeIntegrationInWorker: true// 允许多线程
    }
  })

  mainWindow.loadURL(winURL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  function recordCrash(event, killed) {
    return new Promise((resolve, reject) => {
      try {
        log.h('error', 'recordCrash.event', event)
        log.h('error', 'recordCrash.killed', killed)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  function reloadWindow(mainWin) {
    if (mainWin.isDestroyed()) {
      app.relaunch()
      app.exit(0)
    } else {
      BrowserWindow.getAllWindows().forEach((w) => {
        if (w.id !== mainWin.id) w.destroy()
      })
      mainWin.reload()
    }
  }
  mainWindow.webContents.on('crashed', (event, killed) => {
    const options = {
      type: 'error',
      title: '进程崩溃了',
      message: '这个进程已经崩溃.',
      buttons: ['重载', '退出']
    }
    recordCrash(event, killed).then(() => {
      dialog.showMessageBox(options, (index) => {
        if (index === 0) reloadWindow(mainWindow)
        else app.quit()
      })
    }).catch((e) => {
      console.log(e)
      log.h('error', 'recordCrash.catch', JSON.stringify(e))
    })
  })
}

app.disableHardwareAcceleration() // 来禁用GPU加速。
// 获取单实例锁
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  // 如果获取失败，说明已经有实例在运行了，直接退出
  app.quit()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.setLoginItemSettings({
  openAtLogin: true, // Boolean 在登录时启动应用
  openAsHidden: true // Boolean (可选) mac 表示以隐藏的方式启动应用。~~~~
  // path: '', String (可选) Windows - 在登录时启动的可执行文件。默认为 process.execPath.
  // args: [] String Windows - 要传递给可执行文件的命令行参数。默认为空数组。注意用引号将路径换行。
})
/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
import { globalShortcut } from 'electron'
app.on('ready', () => {
  // const devTools = false
  // globalShortcut.register('tab', () => {
  //   if (devTools) {
  //     mainWindow.webContents.openDevTools()
  //     devTools = false
  //   } else {
  //     mainWindow.webContents.closeDevTools()
  //     devTools = true
  //   }
  // })
  globalShortcut.register('home', () => {
    mainWindow.webContents.send('main-process-home', 'home')
    mainWindow.show()
  })
  app.commandLine.appendSwitch('ignore-certificate-errors')
})
