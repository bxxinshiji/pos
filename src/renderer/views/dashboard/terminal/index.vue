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
    <el-row :gutter="20" class="orderInfo">
        <el-col :span="8">
            <b>今日汇总</b>
        </el-col>
        <el-col :span="16">
            <b style="color:#455A64">{{ date | parseTime('{y}-{m}-{d} {h}:{i}:{s} 星期{a}') }}</b>
        </el-col>

        <el-col :span="8">
          账号: <b style="color:#455A64">{{ username }}</b>
        </el-col>
        <el-col :span="8">
          名称: <b style="color:#455A64">{{ name }}</b>
        </el-col>
        <el-col :span="8">
            <b style="color:#455A64">版本: {{ version }}</b>
        </el-col>

        <el-col :span="8">
          订单: <b style="color:#67C23A">{{orderInfo.count}}</b> 笔
        </el-col>
        <el-col :span="8">
          退款: <b style="color:#0fb9b1">{{orderInfo.returns}}</b> 笔
        </el-col>
        <el-col :span="8">
          未发布: <b style="color:#F56C6C">{{orderInfo.publish}}</b> 笔
        </el-col>
        
        <el-col :span="2.7" v-if="isTotal">
          总金额: <b style="color:#F56C6C">{{(orderInfo.total / 100).toFixed(2)}}</b> 元
        </el-col>
        <span v-for="(pay,key) in orderInfo.pays" :key="key" >
          <el-col :span="2.7" v-if="isTotal || pay.payId > 0"><!-- //不显示现金 -->
            <span>{{pay.name}}: <b style="color:#409EFF">{{(pay.amount / 100).toFixed(2) }}</b> 元</span>
          </el-col>
        </span>
        <el-col :span="24">
            <span>实际扫码金额 <b style="color:#F56C6C">{{(orderInfo.payTotal / 100).toFixed(2) }}</b> 元</span>
        </el-col>
      </el-row>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { Settle as accountsSettle } from '@/api/accounts'
import Terminal from '@/sql2000/model/terminal'
import print from '@/utils/print'
import log from '@/utils/log'

export default {
  name: 'terminal',
  data() {
    return {
      keyboards: [
        { name: '收银台', key: '0', label: 'cashier' },
        { name: '订单查询', key: '1', label: 'order' },
        { name: '支付查询', key: '2', label: 'pay' },
        { name: '盘点商品', key: '3', label: 'inventory' },
        { name: '修改密码', key: '4', label: 'password' },
        // { name: '系统配置', key: '5', label: 'config' },
        { name: '暂离退出', key: '6', label: 'out' },
        { name: '结账退出', key: '7', label: 'accounts' }
        // { name: '退出软件', key: '8', label: 'quit' }
        // { name: '关机', key: '9', label: 'off' }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'name',
      'username',
      'isTerminal'
    ]),
    ...mapState({
      version: state => state.settings.version,
      orderInfo: state => state.terminal.orderInfo,
      date: state => state.healthy.date,
      isTotal: state => state.settings.isTotal
    })
  },
  created() {
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
    this.$store.dispatch('terminal/changeOrderInfo')
    this.initKeyboards()
  },
  methods: {
    initKeyboards() {
      if (this.username === '0000') {
        this.keyboards = [
          // { name: '收银台', key: '0', label: 'cashier' },
          { name: '订单查询', key: '1', label: 'order' },
          { name: '支付查询', key: '2', label: 'pay' },
          // { name: '盘点商品', key: '3', label: 'inventory' },
          // { name: '修改密码', key: '4', label: 'password' },
          { name: '系统配置', key: '5', label: 'config' },
          { name: '暂离退出', key: '6', label: 'out' },
          { name: '结账退出', key: '7', label: 'accounts' },
          { name: '退出软件', key: '8', label: 'quit' }
        // { name: '关机', key: '9', label: 'off' }
        ]
      }
    },
    handler(handler) {
      switch (handler) {
        case 'cashier':
          this.$router.push({ path: '/terminal/cashier' })
          break
        case 'order':
          this.$router.push({ path: '/terminal/order' })
          break
        case 'pay':
          this.$router.push({ path: '/terminal/pay' })
          break
        case 'config':
          this.$router.push({ path: '/terminal/config' })
          break
        case 'inventory':
          this.$router.push({ path: '/terminal/inventory' })
          break
        case 'password':
          this.$router.push({ path: '/terminal/password' })
          break
        case 'out':
          log.scope('quit').info('用户: ' + this.username + ' 暂离退出')
          this.logout()
          break
        case 'accounts':
          log.scope('accounts').info('用户: ' + this.username + ' 结账')
          this.$confirm('结账退出 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            print.accounts(true).then(response => { // 打印结账数据
              this.$message({
                type: 'success',
                message: '结账打印成功'
              })
            }).catch((error) => {
              log.scope('accounts').error('用户: ' + this.username + ' 结账打印失败失败,' + JSON.stringify(error.message))
              console.log(error)
            })
            accountsSettle().then(response => { // 结账
              Terminal.PosCode = this.$store.state.settings.terminal // 更新终端状态
              if (Terminal.PosCode) {
                Terminal.Get().then(() => {
                  Terminal.PosState = '70'
                  Terminal.UserName = ''
                  Terminal.UserCode = ''
                  Terminal.PreJzDate = new Date()
                  Terminal.Save()
                }).catch(error => {
                  console.log(error)
                })
              }
              log.scope('accounts').info('用户: ' + this.username + ' 结账成功退出')
              this.logout()
            }).catch(error => {
              log.scope('accounts').error('用户: ' + this.username + ' 结账成功失败,' + JSON.stringify(error.message))
              this.$message({
                type: 'error',
                message: '结账失败: ' + error.message
              })
            })
          }).catch(() => {
            this.$message({
              type: 'info',
              message: '已取消关机'
            })
          })
          break
        case 'quit':
          log.scope('quit').info('用户: ' + this.username + ' 退出软件')
          this.logout()
          this.$electron.remote.app.quit()
          break
        // case 'off':
        //   this.logout()
        //   require('child_process').exec('shutdown /s /t 0')
        //   break
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
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.router{
  display: -webkit-flex; /* Safari */
  display: flex;
  flex-wrap: wrap;
  span{
    margin: 1.6vw;
    color:#fff;
    font-size:3.3vw;
    width: 25vw;
    height: 15vh;
    line-height: 10vh;
    border-radius:5px;
    padding:2vw;
  }
  .cashier{
    background: @el-success;
  }
  .pay{
    background: #ff6f00;
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
.orderInfo{
  padding: 2vw;
  color: #303133;
  font-size: 15px;
  .el-col{
    margin-bottom: 2vh;
  }
}
</style>
