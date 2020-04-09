<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { SyncTerminal } from '@/api/terminal'
const Mousetrap = require('mousetrap')
require('@/utils/mousetrap-global-bind')
export default {
  name: 'App',
  mounted() {
    this.$store.dispatch('healthy/intervalHealthy') // 健康监测启动
    this.syncTerminal()
    this.globalShortcut()
  },
  methods: {
    syncTerminal() {
      setTimeout(() => {
        SyncTerminal()
      }, 5 * 1000)// 等待 5 秒后第一次同步数据
      setInterval(() => {
        SyncTerminal()
      }, 5000)
    },
    globalShortcut() {
      const KeyboardIndex = this.$store.state.settings.Keyboard.index
      Mousetrap.bindGlobal(KeyboardIndex, () => { // 主页 快捷键
        this.$router.push({ path: '/' })
      })
      const shutDown = this.$store.state.settings.Keyboard.shutDown
      Mousetrap.bindGlobal(shutDown, () => { // 主页 快捷键
        this.shutDown()
      })
    },
    shutDown() { // 关机
      this.$confirm('关闭计算机 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.logout()
        switch (process.platform) {
          case 'win32':
            require('child_process').exec('shutdown /s /t 0')
            break
          default:
            require('child_process').exec('sudo shutdown -h now')
            break
        }
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消关机'
        })
      })
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
