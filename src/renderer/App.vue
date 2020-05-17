<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>

const ipcRenderer = require('electron').ipcRenderer
import { SyncTerminal } from '@/api/terminal'
export default {
  name: 'App',
  mounted() {
    this.$store.dispatch('healthy/intervalHealthy') // 健康监测启动
    this.syncTerminal()
    this.$store.dispatch('terminal/registerGlobalShortcut') // 注册全局快捷键
    // this.logout() // 软件启动先退出
    this.$store.dispatch('settings/changeSetting', { key: 'isHeader', value: false }) // 关闭头部

    ipcRenderer.on('main-process-home', (event, arg) => { // 主进程快捷键主页
      this.$router.push({ path: '/' })
    })
  },
  methods: {
    syncTerminal() {
      setTimeout(() => {
        SyncTerminal()
      }, 5 * 1000)// 等待 5 秒后第一次同步数据
      setInterval(() => {
        SyncTerminal()
      }, 30000)
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}

</script>

<style lang="less">
body {
  background: #ffffff;
}
</style>
