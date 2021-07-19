<template>
    <div class="floor">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-row class="status"> 
              <el-col :span="12">
                <span>状态:</span>
                <span class="success"> 盘点 </span>
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
            <input 
              ref="input"
              v-model.lazy.number="input"
              @keyup.enter="handerInput"
              placeholder="条码/编码/数量"
              type="text"
              oninput="value=value.replace(/[^0-9.;]/g,'')"
              class="el-input__inner"
            />
          </el-row>
        </el-col>
        <el-col :span="10">
          <span v-if="Object.keys(goods).length>0">
            <el-row>
              <el-col class="good">
                <span>名称: {{ goods.name }}</span>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12" class="good">
                <span>单价: {{ goods.price?(goods.price / 100).toFixed(2):'' }}</span>
                <span>小计: {{ goods.price?(goods.total / 100).toFixed(2):'' }}</span>
                <span>部门: {{ goods.depCode }}</span>
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
                <span>今日盘点数据:</span>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12" class="good">
                <span>订单: {{info.count}} 笔</span>
                <span>未上报: {{info.publish}} 笔</span>
              </el-col>
              <el-col :span="12" class="good">
                <span>数量: {{info.number}} </span>
                <span>总金额: {{(info.total / 100).toFixed(2)}} 元</span>
              </el-col>
            </el-row>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="payable background-danger" @click="handerPay">
            <el-row class="total"> 
              <span>盘 点</span>
              <span></span>
              <span>￥{{ (order.waitPay / 100).toFixed(2) }}</span>
            </el-row>
            <el-row class="totals">数量: {{ order.number.toFixed(2) }}</el-row>
          </div>
        </el-col>
      </el-row>
    </div>
</template>

<script>
import { mapState } from 'vuex'
const { Op } = require('sequelize')
import sequelize from '@/model/orderPD'
const Order = sequelize.models.order
export default {
  name: 'foots',
  props: {
  },
  data() {
    return {
      input: '',
      info: {
        count: 0,
        number: 0,
        total: 0,
        publish: 0
      }
    }
  },
  computed: {
    ...mapState({
      version: state => state.settings.version,
      order: state => state.terminal.order,
      goods: state => state.terminal.currentGoods
    })
  },
  filters: {
  },
  created() {
  },
  mounted() {
    this.information()
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
    handerPay() {
      this.$emit('handerPay')
    },
    information() {
      const createdAt = { // 获取当天订单
        [Op.lt]: new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1),
        [Op.gt]: new Date(new Date(new Date().toLocaleDateString()).getTime())
      }
      const userId = this.$store.state.user.username

      Order.count({
        where: {
          userId: userId,
          createdAt: createdAt
        }
      }).then(response => {
        this.info.count = response
      })
      Order.count({
        where: {
          type: 0,
          userId: userId,
          createdAt: createdAt
        }
      }).then(response => {
        this.info.returns = response
      })
      Order.sum('total', {
        where: {
          userId: userId,
          createdAt: createdAt
        }
      }).then(response => {
        this.info.total = response || 0
      })
      Order.sum('number', {
        where: {
          userId: userId,
          createdAt: createdAt
        }
      }).then(response => {
        this.info.number = response || 0
      })
      Order.count({
        where: {
          publish: 0
        }
      }).then(response => {
        this.info.publish = response
      })
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
  color: #ffffff;
}

//*****//
// 修改输入框样式
.el-input__inner{
  margin-top: 1vh;
  background-color: #606266;
  color:#FFF;
  height:6vh;
  line-height:6vh;
  font-size:2.3vh;
  // 隐藏上下箭头6.3
  &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
  -moz-appearance: textfield;
}
.order{
  margin-top: 1vh;
  font-size: 2.1vh;
  .id{
    color: @el-warning;
  }
}
.status{
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
    width: 15%;
  }
  .pay{
    width: 35%;
  }
  .change{
    width: 35%;
  }
  .status{
    width: 15%;
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
    font-size: (100vh/100vw)*5vw;
  }
}
</style>
