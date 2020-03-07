<template>
    <div class="container">
      <el-table
        ref="table"
        :data="goods"
        height="72vh"
        size="mini"
        highlight-current-row
        class="goods"
      >
        <template slot="empty">暂无商品录入</template>
        <el-table-column
          label="#"
          prop="no"
          min-width="35"
        >
        </el-table-column>
        <el-table-column
          prop="pluCode"
          label="编码"
          min-width="110"
        >
        </el-table-column>
        <el-table-column
          prop="name"
          label="商品名称"
          min-width="180"
        >
        </el-table-column>
        <el-table-column
          prop="number"
          label="数量"
          min-width="100"
        >
          <template slot-scope="scope">
            {{ scope.row.number.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="price"
          label="单价"
          min-width="100"
        >
          <template slot-scope="scope">
            {{ (scope.row.price * 0.01).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="total"
          label="小计"
          min-width="100"
        >
          <template slot-scope="scope">
            {{ (scope.row.total * 0.01).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
</template>

<script>

export default {
  name: 'Order',
  components: { },
  data() {
    return {
      goods: []
    }
  },
  computed: {
  },
  created() {
  },
  methods: {
  }
}
</script>

<style lang="less" scoped>
  @import "~@/assets/less/atom/syntax-variables.less";
  .container {
      margin: 1vw;
  }
</style>
