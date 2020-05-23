<template>
    <div class="floor">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-row class="stauts"> 
            <el-col :span="12">
              <span>状态:</span>
              <span v-bind:class="[ order.type ? 'success' : 'danger']"> {{ sales }} </span> 
            </el-col>
            <el-col :span="12" style="text-align:right">
             版本: {{version}}
            </el-col>
          </el-row>
          <el-row class="order"> 
            <span>订单号:</span>
            <span class="id"> {{ order.orderNo }} </span>
          </el-row> 
          <el-row> 
            <el-input 
              ref="input"
              v-model="input" 
              @keyup.enter.native="handerInput"
              @input="hanerOnInput"
              placeholder="条码/编码/付款码/数量"
            />
          </el-row>
        </el-col>
        <el-col :span="10">
          <div v-if="order.pays.length>0">
            <div v-for="(pay,index) in order.pays" :key="index" class="pay-list">
              <div class="name"><span class="warning">{{pay.name}} </span></div>
              <div class="pay">付款: <span class="success">{{(pay.amount / 100).toFixed(2) }} </span></div>
              <div class="change">实收: <span class="brand"> {{((pay.getAmount?pay.getAmount:pay.amount) / 100).toFixed(2) }} </span></div>
              <!-- <div>找零: <span>{{((pay.getAmount - pay.amount) / 100).toFixed(2) }} </span></div> -->
              <div class="status"><span v-bind:class="[ pay.status ? 'success' : 'danger']">{{pay.status ?'已收款':'待收款' }} </span></div>
            </div>
          </div>
          <span v-else-if="Object.keys(goods).length>0">
            <el-row>
              <el-col class="good">
                <span>名称: {{ goods.name }}</span>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12" class="good">
                <span>单价: {{ goods.price?(goods.price / 100).toFixed(2):'' }}</span>
                <span>小计: {{ goods.price?(goods.total / 100).toFixed(2):'' }}</span>
                <span>部门: {{ goods.snapshot.depCode }}</span>
              </el-col>
              <el-col :span="12" class="good">
                <span>数量: {{ goods.number }}</span>
                <span>编码: {{ goods.pluCode }}</span>
                <span>条码: {{ goods.barCode }}</span>
              </el-col>
            </el-row>
          </span>
          <div v-else>
            <el-row>
              <el-col class="good">
                <span>今日收款:</span>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12" class="good">
                <span>订单: {{orderInfo.count}} 笔</span>
                <span>未上报: {{orderInfo.publish}} 笔</span>
                <span>总金额: {{(orderInfo.total / 100).toFixed(2)}} 元</span>
              </el-col>
              <el-col :span="12" class="good">
                <span>退款: {{orderInfo.returns}} 笔</span>
              </el-col>
            </el-row>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="payable background-danger" @click="handerPay">
            <el-row class="total"> 
              <span>需 收</span>
              <span></span>
              <span>数 量: {{ order.number.toFixed(2) }}</span>
            </el-row>
            <el-row class="totals">￥{{ (order.waitPay / 100).toFixed(2) }}</el-row>
          </div>
        </el-col>
      </el-row>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'foots',
  props: {
  },
  data() {
    return {
      input: ''
    }
  },
  computed: {
    ...mapState({
      version: state => state.settings.version,
      order: state => state.terminal.order,
      goods: state => state.terminal.currentGoods,
      orderInfo: state => state.terminal.orderInfo
    }),
    sales() {
      return this.order.type ? '销货' : '退货'
    }
  },
  filters: {
  },
  created() {
  },
  mounted() {
    this.$store.dispatch('terminal/changeOrderInfo')
  },
  methods: {
    focus() {
      this.$refs.input.focus()
    },
    blur() {
      this.$refs.input.blur()
    },
    handerInput() {
      this.$emit('input', this.input)
    },
    hanerOnInput(value) {
      this.input = value.replace(/[^0-9.;]/g, '')
    },
    handerPay() {
      this.$emit('handerPay')
    }
  },
  destroyed() {
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
// 定义相关样式

// 内容样式
.floor{
  width: 100%;
  margin-top: 2vh;
}

//*****//
// 修改输入框样式
.el-input /deep/ .el-input__inner{
  margin-top: 1vh;
  background-color: #606266;
  color:#FFF;
  height:6vh;
  line-height:6vh;
  font-size:2.3vh;
}
.order{
  margin-top: 1vh;
  font-size: 2.1vh;
  .id{
    color: @el-warning;
  }
}
.stauts{
  font-size: 2.1vh;
}
.good{
  
  display: flex;
  flex-direction: column;
  span{
    margin-bottom: 1vh;
    font-size: 2.1vh;
  }
}
.brand{
  color: @el-brand;
}
.success{
  color: @el-success;
}
.warning{
  color: @el-warning;
}
.danger{
  color: @el-danger;
}

.background-success{
  background-color: @el-success;
}
.background-warning{
  background-color: @el-warning;
}
.background-danger{
  background-color: @el-danger;
}
.pay-list{
  display: flex;
  justify-content: space-between;
  font-size: (100vh/100vw)*2vw;
  .name{
    width: 17%;
  }
  .pay{
    width: 35%;
  }
  .change{
    width: 35%;
  }
  .status{
    width: 13%;
    text-align:right;
  }
}
.payable{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 30vw;
  height: 14vh;
  border-radius:4px;
  padding: (100vh/100vw)*1vw;
  color: #ffffff;
  font-weight: 900;
  .total{
    display: flex;
    justify-content: space-between;
    font-size: (100vh/100vw)*3vw;
    padding-left: 1vw;
  }
  .totals {
    font-size: (100vh/100vw)*7vw;
  }
}
</style>
