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
        { name: '暂离退出', key: '7', label: 'out' },
        { name: '结账退出', key: '8', label: 'accounts' },
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
    }
  },
  beforeDestroy() {
    this.removeEventListener()
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
  .accounts{
    background: #e17055;
  }
  .inventory{
    background: #0fb9b1;
  }
}
</style>
