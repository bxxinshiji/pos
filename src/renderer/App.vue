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
      SyncTerminal()
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
@import "~@/assets/less/atom/syntax-variables.less";
//自动移滚动条样式
::-webkit-scrollbar{
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-thumb{
  border-radius: 1em;
  background-color: @syntax-wrap-guide-color;
}
::-webkit-scrollbar-track{
  border-radius: 1em;
  background-color: @syntax-background-color;
}
</style>
