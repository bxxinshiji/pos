<template>
    <span>
      <el-alert
        class="order-end"
        type="success"
        :closable="false"
      >
        <div class="info">
          <span v-if="scand" class="warning"><i class="fa fa-spinner fa-pulse fa-fw"></i>  {{warning}}</span>
          <span v-if="error" class="error"><i class="fa fa-times-circle fa-fw"></i> {{error}}</span>
          <div class="payAmount"> 
            <span class="id"> 收款金额: </span>
            <span>{{ (payAmount / 100).toFixed(2) }} </span>
          </div> 
        </div>
        <span v-for="(pay,index) in pays" :key="index">
          <el-button v-if="pay.type!='pay'" type="primary" :disabled="pay.type!='cashPay'" @click="handerPay(pay.id)"> {{ pay.key }} {{ pay.name }}</el-button>
        </span>
      </el-alert>
      <pay-html ref="pay"/>
    </span>
</template>

<script>

const Mousetrap = require('mousetrap')
require('@/utils/mousetrap-global-bind')

import { mapState } from 'vuex'
import store from '@/store'
const payKeyboard = store.state.settings.payKeyboard

import pay from './pay'
import onkeydown from '@/utils/onkeydown'
import Pay from '@/model/pay'
import PayHtml from '@/components/Pay'

export default {
  name: 'pay',
  components: { PayHtml },
  props: {
  },
  data() {
    return {
      pays: [],
      error: '', // 错误信息
      scand: false, // 扫码付款是否开始
      warning: '付款中' // 等待信息
    }
  },
  computed: {
    ...mapState({
      order: state => state.terminal.order,
      payAmount: state => state.terminal.payAmount,
      scanStoreName: state => state.settings.scanStoreName,
      scanPayId: state => state.settings.scanPayId,
      orderTitle: state => state.settings.orderTitle,
      terminal: state => state.settings.terminal,
      username: state => state.user.username
    })
  },
  created() {
    this.initPay()
    this.registerMemory()
    this.registerMousetrap()
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    ...pay,
    initPay() {
      Pay.models.pay.findAll().then(pays => { // 初始化支付
        pays.forEach(item => {
          this.pays.push({
            id: String(item.id ? item.id : '0'),
            name: item.name ? item.name : '',
            key: payKeyboard[item.id],
            type: item.type ? item.type : ''
          })
        })
      })
    },
    initInfo() {
      this.error = '' // 错误信息
      this.scand = false // 扫码付款是否开始
      this.warning = '付款中' // 等待信息
    },
    registerMousetrap() { // 注册快捷键
      Object.keys(payKeyboard).map(key => {
        if (payKeyboard[key]) {
          Mousetrap.bindGlobal(payKeyboard[key], () => {
            this.handerPay(key)
          })
        }
      })
    },
    registerMemory() { // 注册键盘监听
      onkeydown.string = ''
      onkeydown.register(/[0-9;]/, 'Enter', () => {
        const code = onkeydown.string
        const regVipCard = /^((;)\d{20})$/
        if (regVipCard.test(code)) { // 储值卡正则
          this.cardPay(code)
        } else {
          this.scanPay(code) // 扫码
        }
      })
    },
    unregisterMousetrap() {
      onkeydown.unregister() // 注销键盘监听
      Object.keys(payKeyboard).map(key => { // 注销快捷键
        if (payKeyboard[key]) {
          Mousetrap.unbindGlobal(payKeyboard[key])
        }
      })
    },
    handleClose() {
      this.unregisterMousetrap() // 注销所有键盘监听和快捷键
      this.$store.dispatch('terminal/changeIsPay', false) // 关闭支付页面
    },
    keydown(e) {
      if (e.keyCode === 27) { // esc关闭消息
        this.handleClose()
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.order-end{
    position:fixed;
    margin:auto;
    left:0;
    right:0;
    top:0;
    bottom:0;
    width: 80vw;
    height: 50vh;
}
.el-alert /deep/ .el-alert__description{
  font-size: (100vh/100vw)*7vw;
  font-weight: 900;
}
.el-button{
  margin-left: 1vw;
  margin-right: 1vw;
  font-size: (100vh/100vw)*2.7vw;
}
.info{
  text-align:center;
  .payAmount{
    margin:0 auto;
    font-size: 6vh;
    span{
      color: @el-danger;
    }
  }
  .warning{
    font-size: 7vh;
    color: #E6A23C;
    margin:0 auto;
  }
}
.wechat{
  color: #67C23A;
}
.alipay{
  color: #409EFF;
}
.error{
  color: #F56C6C;
}
</style>
