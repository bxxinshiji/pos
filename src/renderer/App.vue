<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { SyncTerminal } from '@/api/terminal'
// const Mousetrap = require('mousetrap')
// require('@/utils/mousetrap-global-bind')
export default {
  name: 'App',
  mounted() {
    console.log(this.$electron, this.$electron.remote)
    this.$store.dispatch('healthy/intervalHealthy') // 健康监测启动
    this.syncTerminal()
    this.$store.dispatch('terminal/registerGlobalShortcut') // 注册全局快捷键
    // this.logout() // 软件启动先退出
    this.$store.dispatch('settings/changeSetting', { key: 'isHeader', value: false }) // 关闭头部
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
