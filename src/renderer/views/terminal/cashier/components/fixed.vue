<template>
    <el-alert
      class="order-end"
      type="success"
      :closable="false"
    >
      <div>应收:<span>{{(amount*0.01).toFixed(2)}}</span></div>
      <div>实收:<span>{{(getAmount*0.01).toFixed(2)}}</span></div>
      <div class="change">找零:<span>{{((getAmount-amount)*0.01).toFixed(2)}}</span></div>
    </el-alert>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'fixed',
  props: {
  },
  data() {
    return {
      amount: 0.00,
      getAmount: 0.00
    }
  },
  computed: {
    ...mapState({
      pays: state => state.terminal.order.pays
    })
  },
  watch: {
    pays: {
      handler: function(val, oldVal) {
        let getAmount = 0
        let amount = 0
        this.pays.forEach(pay => {
          getAmount = getAmount + (pay.getAmount ? pay.getAmount : pay.amount)
          amount = amount + pay.amount
        })
        this.getAmount = getAmount
        this.amount = amount
      },
      deep: true
    }
  },
  created() {
  },
  mounted() {
  },
  methods: {
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
    max-width: 800px;
    height: 30vh;
}
.el-alert /deep/ .el-alert__description{
  font-size: (100vh/100vw)*7vw;
  font-weight: 900;
}
.change{
  color: @el-danger;
}
</style>
