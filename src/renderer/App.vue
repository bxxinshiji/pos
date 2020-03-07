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
</style>
