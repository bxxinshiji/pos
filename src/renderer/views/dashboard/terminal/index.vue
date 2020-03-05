<template>
  <div>
    <div
      class="router"
    >
      <span 
        v-for="(keyboard,index) in keyboards" 
        :key="index" 
        v-bind:class="keyboard.label"
        @click="handler(keyboard.label)"
      >
        <svg-icon :icon-class="keyboard.label"/> 
        {{keyboard.key}} {{keyboard.name}}
      </span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Settle as accountsSettle } from '@/api/accounts'
export default {
  name: 'terminal',
  data() {
    return {
      keyboards: [
        { name: '收银台', key: '0', label: 'cashier' },
        { name: '订单查询', key: '1', label: 'order' },
        { name: '盘点商品', key: '2', label: 'inventory' },
        { name: '修改密码', key: '3', label: 'password' },
        { name: '系统配置', key: '4', label: 'config' },
        { name: '暂离退出', key: '6', label: 'out' },
        { name: '结账退出', key: '7', label: 'accounts' },
        { name: '退出软件', key: '8', label: 'quit' },
        { name: '关机', key: '9', label: 'off' }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'name',
      'isTerminal'
    ])
  },
  created() {
  },
  mounted() {
    this.$store.dispatch('healthy/intervalHealthy') // 健康监测启动
    document.addEventListener('keydown', this.keydown)
  },
  methods: {
    handler(handler) {
      switch (handler) {
        case 'cashier':
          this.$router.push({ path: '/terminal/cashier' })
          break
        case 'order':
          this.$router.push({ path: '/terminal/order' })
          break
        case 'config':
          this.$router.push({ path: '/terminal/config' })
          break
        case 'inventory':
          this.$router.push({ path: '/terminal/inventory' })
          break
        case 'out':
          this.logout()
          break
        case 'accounts':
          accountsSettle() // 结账
          this.logout()
          break
        case 'quit':
          this.$electron.remote.app.quit()
          break
        case 'off':
          require('child_process').exec('shutdown /s /t 0')
          break
        default:
          console.log('功能暂时无法实现')
          break
      }
    },
    keydown(e) {
      this.keyboards.forEach(element => {
        if (element['key'] === e.key) {
          this.handler(element['label'])
        }
      })
    },
    handleClose() {
      this.removeEventListener() // 注销所有键盘监听和快捷键
    },
    removeEventListener() {
      document.removeEventListener('keydown', this.keydown)
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  },
  beforeDestroy() {
    this.removeEventListener()
  },
  destroyed() {
    this.$store.dispatch('healthy/clearInterval') // 健康监测关闭
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.dashboard {
  &-container {
    margin: 30px;
  }
  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}
.router{
  display: -webkit-flex; /* Safari */
  display: flex;
  flex-wrap: wrap;
  span{
    margin: 15px;
    color:#fff;
    font-size:38px;
    width: 280px;
    height: 100px;
    line-height: 60px;
    border-radius:5px;
    padding:20px;
  }
  .cashier{
    background: @el-success;
  }
  .order{
    background: @el-brand;
  }
  .password{
    background: @el-info;
  }
  .config{
    background:#303133;
  }
  .out{
    background: @el-warning;
  }
  .off{
    background: @el-danger;
  }
  .quit{
    background: #455A64;
  }
  .accounts{
    background: #e17055;
  }
  .inventory{
    background: #0fb9b1;
  }
}
</style>
