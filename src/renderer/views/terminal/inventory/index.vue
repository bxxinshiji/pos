<template>
    <div 
      class="container"
      @click="focus"
    >
      <heads
        ref="heads"
      />
      <item
        ref="goods"
      />
      <foots
        ref="foots"
        @input="handerInput"
        @handerPay="handerPay"
      />
      <fixed
        ref="fixed"
        v-show="order.status"
      />
    </div>
</template>

<script>
import hander from './hander/hander'
import mousetrapHander from './hander/mousetrap'
import goodsHander from './hander/goods'

import { mapState } from 'vuex'

import Heads from './components/heads.vue'
import Item from './components/item.vue'
import Foots from './components/foots.vue'
import Fixed from './components/fixed.vue'
export default {
  name: 'Inventory',
  components: { Heads, Item, Foots, Fixed },
  data() {
    return {

    }
  },
  computed: {
    ...mapState({
      order: state => state.terminal.order
    })
  },
  watch: {
    order: {
      handler: function(val, oldVal) {
        this.$store.dispatch('terminal/handerOrder')
      },
      deep: true
    }
  },
  created() {
    this.registerMousetrap()// 初始化 启用按键监听
    this.closeSideBar()// 缩小侧栏
  },
  mounted() {
    this.focus()
    this.initOrder()
  },
  methods: {
    ...mousetrapHander,
    ...goodsHander,
    closeSideBar() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: true })
    },
    focus() { // 聚焦
      this.$refs.foots.focus()
    },
    blur() { // 失焦点
      this.$refs.foots.blur()
    },
    async initOrder() {
      await this.$store.dispatch('terminal/changeInitOrder', 'orderPD').then(() => {
        this.$store.dispatch('terminal/changeCurrentGoods', {}) // 选中商品情况
      }).catch(error => {
        this.blur()
        // sysError
        this.$alert(error, '系统错误', {
          type: 'error',
          showConfirmButton: false
        })
      })
    },
    setInput(value) {
      this.$refs.foots.input = value
      this.$refs.foots.$refs.input.value = value
    },
    getInput() {
      return this.$refs.foots.$refs.input.value
    },
    async handerInput(value) {
      // 完成订单状态清空订单
      if (this.order.status) {
        await this.initOrder()
      }
      if (value) {
        this.setInput()
        this.addGoods(value, true) // state.settings.isPlucode 是否允许通过 plucode 查询
      }
    },
    handerPay() {
      hander['pay'](this)
    },
    MessageBox({ title, message }, type = 'error') {
      this.$confirm(message, title, {
        type: type,
        showCancelButton: false,
        showConfirmButton: false,
        center: true
      }).then(() => {
      }).catch(() => {
      })
    }
  },
  destroyed() {
    this.unregisterMousetrap()// 注销按键监听
  }
}
</script>

<style lang="less" scoped>
  @import "~@/assets/less/atom/syntax-variables.less";
  .container {
    background-color: #000;
    color: @syntax-text-color;
    height:100vh;
    padding: 1vw;
  }
</style>
