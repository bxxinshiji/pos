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
      }, 30000)
    },
    globalShortcut() {
      const KeyboardIndex = this.$store.state.settings.Keyboard.index
      Mousetrap.bindGlobal(KeyboardIndex, () => { // 主页 快捷键
        this.$router.push({ path: '/' })
      })
    }
  }
}

</script>

<style lang="less">
</style>
