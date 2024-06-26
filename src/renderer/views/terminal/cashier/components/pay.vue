<template>
    <span>
      <el-alert
        class="order-end"
        type="success"
        :closable="false"
      >
        <div class="info">
          <span class="useTime">
              <span v-if="useTime.Date">{{useTime.Date}} 天</span>
              <span v-if="useTime.Hours">{{useTime.Hours}} 小时</span>
              <span v-if="useTime.Minutes">{{useTime.Minutes}} 分</span>
              <span v-if="useTime.Seconds">{{useTime.Seconds}} 秒</span>
          </span>
          <span :class="status">
            <svg-icon v-if="method" :icon-class="method" :class="method"/>
            <i v-if="status==='wait'" class="fa fa-jpy"></i> 
            <i v-if="status==='waitClose'" class="fa fa-refresh fa-pulse"></i> 
            <i v-if="status==='off'" class="fa fa-power-off"></i> 
            {{info}}
          </span>
          <br>
          <span :class="status">
            <i v-if="status==='warning'" class="fa fa-spinner fa-pulse"></i> 
            <i v-if="status==='error'" class="fa fa-times-circle"></i> 
            {{payingInfo}}
          </span>
          <div class="payAmount"> 
            <span class="id"> 收款金额: </span>
            <span>{{ (payAmount / 100).toFixed(2) }} </span>
          </div> 
        </div>
        <span v-for="(pay,index) in pays" :key="index">
          <el-button v-if="pay.type!='pay'" type="primary" :disabled="pay.type!='cashPay'" @click="handerPay(pay.id)"> {{ pay.key }} {{ pay.name }}</el-button>
        </span>
      </el-alert>
    </span>
</template>

<script>

const Mousetrap = require('mousetrap')
require('@/utils/mousetrap-global-bind')

const events = require('events')
import { mapState } from 'vuex'
import store from '@/store'
const payKeyboard = store.state.settings.payKeyboard
import log from '@/utils/log'

import pay from './pay'
import onkeydown from '@/utils/onkeydown'
import { useTime } from '@/utils'

import Pay from '@/utils/pay/index'

export default {
  name: 'pay',
  props: {
  },
  data() {
    return {
      EventEmitter: new events.EventEmitter(),
      lock: false, // 支付锁[扫码、会员卡会锁定]
      info: '等待付款操作',
      payingInfo: '',
      status: 'wait', // 支付状态[wait 等待付款中(蓝色) warning 付款中(黄色)、error 错误状态[红色]、waitClose 等待关闭[灰色]、off 关闭[黑色]]
      startTime: new Date(), // 支付开始时间
      useTime: 0,
      method: '', // 支付方式显示
      model: new Pay()
    }
  },
  computed: {
    ...mapState({
      isPay: state => state.terminal.isPay,
      pays: state => state.terminal.pays,
      order: state => state.terminal.order,
      payAmount: state => state.terminal.payAmount,
      scanStoreName: state => state.settings.scanStoreName,
      scanPayId: state => state.settings.scanPayId,
      cardPayID: state => state.settings.cardPayID,
      orderTitle: state => state.settings.orderTitle,
      terminal: state => state.settings.terminal,
      username: state => state.user.username,
      cardPayInfo: state => { // 计算会员卡支付信息[配置里面可以设置]
        let info = {}
        state.terminal.pays.forEach(pay => {
          if (pay.id === state.settings.cardPayID) {
            info = pay
          }
        })
        return info
      }
    })
  },
  created() {
  },
  mounted() {
    if (this.order.waitPay === 0) {
      this.handerOrder()
    }
    document.addEventListener('keydown', this.keydown)
    setInterval(() => {
      this.useTime = useTime(this.startTime)
    }, 1000)
    this.registerMemory()
    this.registerMousetrap()
    this.EventOn() // 监听事件开启
  },
  methods: {
    ...pay,
    initInfo() {
      this.status = 'warning'
      this.info = '付款中'
      this.startTime = new Date()
    },
    registerMousetrap() { // 注册快捷键
      Object.keys(payKeyboard).map(key => {
        if (payKeyboard[key]) {
          Mousetrap.bindGlobal(payKeyboard[key].toLowerCase(), () => {
            log.h('info', 'Pay.Mousetrap', '【' + payKeyboard[key] + '】' + key)
            if (this.lock) {
              this.$message({
                type: 'error',
                message: '已锁定正在支付中请稍等...'
              })
            } else {
              this.handerPay(key)
            }
          })
        }
      })
    },
    registerMemory() { // 注册键盘监听
      onkeydown.string = ''
      onkeydown.register(/[0-9;]/, 'Enter', () => {
        if (this.lock) {
          this.$message({
            type: 'error',
            message: '已锁定正在支付中请稍等...'
          })
        } else {
          this.lock = true
          const code = onkeydown.string
          const regVipCard = /^((;)\d{20})$/
          if (regVipCard.test(code)) { // 储蓄卡正则
            this.cardPay(code)
          } else {
            this.scanPay(code) // 扫码
          }
        }
      })
    },
    unregisterMousetrap() {
      onkeydown.unregister() // 注销键盘监听
      Object.keys(payKeyboard).map(key => { // 注销快捷键
        if (payKeyboard[key]) {
          Mousetrap.unbindGlobal(payKeyboard[key].toLowerCase())
        }
      })
    },
    handleClose() {
      this.unregisterMousetrap() // 注销所有键盘监听和快捷键
      this.$store.dispatch('terminal/changeIsPay', false) // 关闭支付页面
    },
    keydown(e) {
      if (e.keyCode === 27) { // esc关闭消息
        this.model.On('cancel', cancel => { // 支付页面关闭监听
          if (cancel) {
            this.handleClose()
          }
        })
        this.model.Cancel()
        log.h('info', 'Pay.keydown', 'esc')
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
    this.unregisterMousetrap() // 注销所有键盘监听和快捷键
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
  position: relative;
  text-align:center;
  .useTime{
    position:absolute;
    right: 20px;
    top: 20px;
    font-size: 2vh;
    color: #909399;
  }
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
.remoteCardPay{
  color: #ff6f00;
}
.cardPay{
  color: #ff6f00;
}
.cashPay{
  color: #0fb9b1;
}
.wait{
  color: #409EFF;
}
.warning{
  color: #E6A23C;
}
.error{
  color: #F56C6C;
}
.waitClose{
  color: #909399;
}
.off{
  color: #303133;
}
</style>
