<template>
    <el-alert
      class="order-end"
      type="success"
      :closable="false"
    >
      <div><span>【盘点】订单完成</span></div>
      <div class="change">数量: <span>{{number}}</span></div>
      <div>金额: <span>{{(total / 100).toFixed(2)}}</span></div>
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
      number: 0.00,
      total: 0.00
    }
  },
  computed: {
    ...mapState({
      goods: state => state.terminal.order.goods
    })
  },
  watch: {
    goods: {
      handler: function(val, oldVal) {
        let number = 0
        let total = 0
        this.goods.forEach(good => {
          number = number + good.number
          total = total + good.total
        })
        this.number = number
        this.total = total
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
