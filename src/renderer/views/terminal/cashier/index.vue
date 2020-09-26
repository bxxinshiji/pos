<template>
  <div 
    class="coliect-container"
    v-bind:class="[ order.type ? 'success' : 'danger']"
    ref="container"
  >
    <span
      calss="container"
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
        @handerPay="handerPay"
      />
    </span>
    <span
      class="fixed"
    >
      <fixed
        ref="fixed"
        v-show="order.status"
      />
      <pay
        ref="pay"
        v-if="isPay"
        :order="order"
      />
      <input-price
        v-show="isInputPrice"
        @cacheGoods="handerCacheGoods"
      />
    </span>
  </div>
</template>

<script>
import hander from './hander/hander'
import mousetrapHander from './hander/mousetrap'
import goodsHander from './hander/goods'

import { mapState, mapGetters } from 'vuex'

import Heads from './components/heads.vue'
import Item from './components/item.vue'
import Foots from './components/foots.vue'
import Fixed from './components/fixed.vue'
import Pay from './components/pay.vue'
import InputPrice from './components/inputPrice.vue'
import onkeydown from '@/utils/onkeydown'

// import { Pay, Refund } from '@/api/pay'
import { Get as VipCardGet } from '@/api/vip_card'
import log from '@/utils/log'
export default {
  components: { Heads, Item, Foots, Fixed, Pay, InputPrice },
  name: 'cashier',
  data() {
    return {
      lockGoods: false // 商品输入锁
    }
  },
  computed: {
    ...mapGetters([
      'name',
      'username'
    ]),
    ...mapState({
      isInputPrice: state => state.terminal.isInputPrice,
      isPay: state => state.terminal.isPay,
      order: state => state.terminal.order,
      loadOrder: state => state.terminal.loadOrder
    })
  },
  created() {
    this.registerMousetrap()// 初始化 启用按键监听
    this.closeSideBar()// 缩小侧栏
  },
  mounted() {
    this.focus()
    document.addEventListener('keydown', this.keydown)
    if (Object.keys(this.loadOrder).length > 0) { // 判断是否使用加载的缓存订单
      this.$store.dispatch('terminal/changePullLoadOrder')
    } else {
      this.initOrder()
    }
    this.$store.dispatch('terminal/changeInitPays') // 初始化付款信息
    onkeydown.isScanner('Enter', (res) => {
      if (this.$refs.foots) {
        this.handerInput(this.$refs.foots.input, !res)
      }
    })
  },
  watch: {
    order: {
      handler: function(val, oldVal) {
        this.$store.dispatch('terminal/handerOrder')
      },
      deep: true
    },
    isInputPrice: {
      handler: function(val, oldVal) {
        val ? this.blur() : this.focus()
      },
      deep: true
    },
    isPay: {
      handler: function(val, oldVal) {
        val ? this.blur() : this.focus()
      },
      deep: true
    }
  },
  methods: {
    ...goodsHander,
    ...mousetrapHander,
    closeSideBar() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: true })
    },
    focus() { // 聚焦
      setTimeout(() => {
        this.$refs.foots.focus()
      }, 100)// 聚焦延时
    },
    blur() { // 失焦点
      this.$refs.foots.blur()
    },
    async initOrder() {
      await this.$store.dispatch('terminal/changeInitOrder').then(() => {
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
    handerVipCardGet(code) {
      // 先查询余额
      VipCardGet(code).then(res => {
        this.$confirm(
          '<p>会员卡余额: <b style="color:#F56C6C">' + res.amount.toFixed(2) + ' 元</b></p>' +
        '<p>会员卡编码: <b>' + res.cardNo + '</b></p>' +
        '<p>会员卡名称: <b>' + res.name + '</b></p>'
          , '会员卡信息', {
            type: 'success',
            showCancelButton: false,
            showConfirmButton: false,
            dangerouslyUseHTMLString: true
          }).then(() => {
        }).catch(() => {
        })
      }).catch(error => {
        this.MessageBox({
          title: '会员卡查询失败',
          message: error
        })
      })
    },
    setInput(value) {
      if (value === undefined) {
        value = ''
      }
      this.$refs.foots.input = value
      this.$refs.foots.$refs.input.value = value
    },
    getInput() {
      return this.$refs.foots.$refs.input.value
    },
    async handerInput(value, isPlucode) {
      log.h('info', 'cashier.handerInput', JSON.stringify(value) + ' ' + isPlucode)
      if (this.isPay) {
        this.$message({
          type: 'warning',
          message: '支付锁定中禁止输入'
        })
        return
      }
      // 完成订单状态清空订单
      if (this.order.status) {
        await this.initOrder() // 【异步等待】修复输入第一个商品条码回车有时候无反应问题无反应问题
      }
      this.setInput()
      // 储值卡正则
      var regVipCard = /^((;)\d{20})$/
      if (regVipCard.test(value)) { // 储值卡查询
        this.handerVipCardGet(value)
      } else if (value) { // 添加商品
        var number = /^[0-9]*$/ // 正则匹配正整数
        if (number.test(value)) {
          this.addGoods(value, isPlucode) // isPlucode 是否允许通过 plucode 查询
        } else {
          this.$message({
            type: 'warning',
            message: '输入错误请重试,输入内容:' + value
          })
        }
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
    },
    handerCacheGoods(cacheGoods) { // 缓存商品价格处理
      this.$refs.goods.addGoods(cacheGoods)
    },
    keydown(e) {
      if (e.keyCode === 27) { // esc 自动聚焦
        this.focus()
      }
    }
  },
  destroyed() {
    document.removeEventListener('keydown', this.keydown)
    this.unregisterMousetrap()// 注销按键监听
    this.$store.dispatch('terminal/changeIsPay', false) // 关闭支付页面
    this.$store.dispatch('terminal/changeLoadOrder', this.order) // 离开页面载入未付款订单
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
// 定义相关样式
.coliect-container{
  background-color: @syntax-background-color;
  color: @syntax-text-color;
  height:100vh;
  padding: 1vw;
}
.success{
  color: @syntax-text-color;
}
.danger{
  color: @el-danger;
}
</style>
