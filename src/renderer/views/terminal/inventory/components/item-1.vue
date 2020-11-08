<template>
      <el-table
        ref="table"
        :data="showGoods"
        height="72vh"
        size="mini"
        highlight-current-row
        class="goods"
        :row-class-name="tableRowClassName"
      >
        <template slot="empty">暂无商品录入</template>
        <el-table-column
          :label="'# '+String(goods.length)"
          prop="no"
          min-width="55"
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
            {{ (scope.row.price / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="total"
          label="小计"
          min-width="100"
        >
          <template slot-scope="scope">
            {{ (scope.row.total / 100).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
</template>

<script>
import { mapState } from 'vuex'
import { md5Sign } from '@/utils/crypto'
import sequelize from '@/model/orderPD'
const Snapshots = sequelize.models.snapshot
import log from '@/utils/log'

export default {
  name: 'goods',
  props: {
  },
  data() {
    return {
      currentRow: 0,
      showNumber: 10,
      differ: 0
    }
  },
  computed: {
    ...mapState({
      goods(state) {
        return state.terminal.order.goods
      },
      showGoods(state) { // 优化渲染性能
        const showGoods = []
        const goods = state.terminal.order.goods
        const showNumber = goods.length < this.showNumber ? goods.length : this.showNumber
        if (this.currentRow >= showNumber && showNumber > 0) {
          this.differ = this.currentRow - (showNumber - 1)
        } else {
          this.differ = 0
        }
        for (let index = 0; index < showNumber; index++) {
          const item = goods[index + this.differ]
          showGoods.push({
            no: item.no,
            pluCode: item.pluCode,
            name: item.name,
            number: item.number,
            price: item.price,
            total: item.total
          })
        }
        return showGoods
      }
    })
  },
  created() {
  },
  mounted() {
    this.resetCurrentRow()
  },
  methods: {
    // 1 or -1 上下选择行
    handerCurrentRow(value) {
      if (value > 0 && this.goods.length - 1 > this.currentRow) {
        this.currentRow = this.currentRow + value
      }
      if (value < 0 && this.currentRow > 0) {
        this.currentRow = this.currentRow + value
      }
      this.setCurrentRow(this.currentRow)
    },
    // 重置选择行
    async resetCurrentRow(value = 0) {
      this.currentRow = value
      this.setCurrentRow(this.currentRow)
      this.$nextTick(() => { // 计算显示数量
        this.setShowNumber()
      })
    },
    // 设置选择航
    setCurrentRow(value) {
      // this.$refs.table.setCurrentRow(this.goods[value])
      if (this.goods[value]) {
        this.$store.dispatch('terminal/changeCurrentGoods', this.goods[value])
      }
    },
    // 滚动窗口到指定行
    setShowNumber(value) {
      if (this.showNumber === 10) {
        let clientHeight = 0
        const row = document.getElementsByClassName('el-table__row') // 获取元素
        if (row.length > 0) {
          clientHeight = row[0].clientHeight // 获取其中一个的高度
        }
        const table = document.getElementsByClassName('el-table')
        const showNumber = parseInt(table[0].clientHeight / clientHeight)
        if (showNumber > 0) {
          this.showNumber = showNumber - 1
        }
      }
    },
    tableRowClassName({ row, rowIndex }) {
      if (rowIndex === this.currentRow - this.differ) {
        return 'current-row'
      }
    },
    // 设置选择行数量
    setNumber(number) {
      if (number && this.goods.length > 0) {
        // 防止输入 1.256.6655.6这类数
        number = parseFloat(number).toFixed(2)
        this.goods[this.currentRow].number = number
        this.goods[this.currentRow].total = number * this.goods[this.currentRow].price
        this.$store.dispatch('terminal/changeCurrentGoods', this.goods[this.currentRow])
      }
    },
    // 预处理商品
    handler(goods) {
      // 更新快照信息
      goods.snapshot.name = goods.name
      goods.snapshot.spec = goods.spec
      goods.snapshot.barCode = goods.barCode
      // 计算商品 MD5
      const MD5 = md5Sign(JSON.stringify(goods.snapshot))
      goods.snapshotId = MD5
      // 创建商品快照
      Snapshots.create({
        id: MD5,
        snapshot: goods.snapshot
      })
    },
    // 增加商品
    addGoods(goods) {
      this.handler(goods)
      this.goods.unshift(goods)
      this.resetCurrentRow()
      log.h('info', 'cashier.item.addGoods', JSON.stringify(goods))
    },
    // 删除选择商品
    deleteGoods() {
      if (this.goods.length > 0) {
        this.goods.splice(this.currentRow, 1)
        const currentRow = this.currentRow > 0 ? this.currentRow - 1 : 0
        this.resetCurrentRow(currentRow)
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.goods{
  width:100vw;
}
.el-table /deep/ .cell{
    line-height:3vh;
}
.el-table /deep/ th{
    color: #ffffff;
    font-size:2.5vh;
    background-color: #000;
}
.el-scrollbar__wrap {
  overflow-x: hidden;
}
.el-table /deep/ tr{
    font-size:2.5vh;
    color: #ffffff;
    background-color: #000;
}
.el-table {
    font-size:2.5vh;
    background-color: #000;
}
.el-table /deep/ .el-table__body tr.current-row>td{
  color: @el-danger;
  font-size:3vh;
}
// 取消背景色
.el-table /deep/ .el-table__body tr.current-row>td,.el-table /deep/ .el-table__body tr.hover-row>td{
  background-color: #000;
}

// 自动移滚动条样式
.goods ::-webkit-scrollbar{
  width: 4px;
  height: 4px;
}
.goods ::-webkit-scrollbar-thumb{
  border-radius: 1em;
  background-color: @syntax-wrap-guide-color;
}
.goods ::-webkit-scrollbar-track{
  border-radius: 1em;
  background-color: #000;
}
</style>
