<template>
    <div class="container">
      <el-table
        v-loading="loading"
        element-loading-text="拼命加载中"
        ref="table"
        :data="rows"
        height="80vh"
        size="mini"
        highlight-current-row
      >
        <template slot="empty">未查询到订单</template>
        <el-table-column
          prop="userId"
          label="用户"
          min-width="60"
        >
        </el-table-column>
        <el-table-column
          prop="number"
          label="数量"
          min-width="60"
        >
        <template slot-scope="scope">
            {{ scope.row.number.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="total"
          label="总价"
          min-width="80"
        >
          <template slot-scope="scope">
            {{ (scope.row.total / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="type"
          label="状态"
          min-width="70"
        >
          <template slot-scope="scope">
            <el-tag 
              size="small"
              :type="scope.row.type?'success':'warning'"
            >
            {{ scope.row.type?'销货挂单':'退货挂单' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-row>
          <el-col :span="8.5">
            <div class="button">
                  <el-button type="primary" @click="handerPull(currentOrder)">
                    0 取出挂单
                  </el-button>
                  <el-button type="info" @click="handerOrderInfo(currentOrder)">
                    1 订单详情
                  </el-button>
                  <el-button type="danger" @click="handerDelete(currentOrder)">
                    2 删除订单
                  </el-button>
            </div>
          </el-col>
          <el-col :span="15.5">
            <!-- <div class="black-info ">
                  快捷键: 2 发布、3 打印、 PgUp 首页、 PgDn 最后一页、← 上页、→ 下页、↑ 向上、↓ 向下
            </div> -->
          </el-col>
      </el-row>
      <el-dialog title="订单详情" v-if="dialogOrderInfoVisible" :visible.sync="dialogOrderInfoVisible" :fullscreen="true">
        <el-row>
          <el-col :span="8" class="orderInfo">
            <!-- <span>订单编号: {{ currentOrder.orderNo }}</span> -->
            <span>终端编号: {{ currentOrder.terminal }}</span>
            <span>收款用户: {{ currentOrder.userId }}</span>
          </el-col>
          <el-col :span="8" class="orderInfo">
            <span style="color: #67C23A">订单金额: {{ currentOrder.total?(currentOrder.total / 100).toFixed(2):(0).toFixed(2) }} 元</span>
            <span style="color: #409EFF">实际收款: {{ currentOrder.getAmount?(currentOrder.getAmount / 100).toFixed(2):(0).toFixed(2) }} 元</span>
          </el-col>
          <el-col :span="8" class="orderInfo">
            <span>商品数量: {{ currentOrder.number }}</span>
              <span>订单类型: 
                <el-tag 
                  size="mini"
                  :type="currentOrder.type?'success':'warning'"
                >
                {{ currentOrder.type?'销货挂单':'退货挂单' }}
                </el-tag>
              </span>
          </el-col>
        </el-row>
        <el-table :data="currentOrder.goods" size="mini" max-height="250">
          <el-table-column label="商品信息">
            <el-table-column property="no" label="#" width="50"></el-table-column>
            <el-table-column property="pluCode" label="编码" width="100"></el-table-column>
            <el-table-column property="name" label="商品名称" width="130"></el-table-column>
            <el-table-column property="price" label="单价" width="100">
              <template slot-scope="scope">
              {{ (scope.row.price / 100).toFixed(2) }} 元
            </template>
            </el-table-column>
            <el-table-column property="number" label="数量" width="60"></el-table-column>
            <el-table-column property="total" label="小计" width="100">
              <template slot-scope="scope">
                {{ (scope.row.total / 100).toFixed(2) }} 元
              </template>
            </el-table-column>
            <el-table-column property="barCode" label="条码"></el-table-column>
          </el-table-column>
        </el-table>
        <el-table :data="currentOrder.pays" size="mini" max-height="170">
          <el-table-column label="支付信息">
            <el-table-column property="no" label="#" width="50"></el-table-column>
            <el-table-column property="name" label="付款方式" width="80"></el-table-column>
            <el-table-column property="amount" label="金额" width="100">
              <template slot-scope="scope">
              {{ (scope.row.amount / 100).toFixed(2) }} 元
            </template>
            </el-table-column>
            <el-table-column property="getAmount" label="实收" width="100">
              <template slot-scope="scope">
                {{ (scope.row.getAmount / 100).toFixed(2) }} 元
              </template>
            </el-table-column>
            <el-table-column property="orderNo" label="单号/卡号" width="180"></el-table-column>
            <el-table-column property="status" label="状态">
              <template slot-scope="scope">
                <el-tag 
                    size="mini"
                    :type="scope.row.status?'success':'warning'"
                  >
                  {{ scope.row.status?'已支付':'未支付' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table-column>
        </el-table>
      </el-dialog>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
export default {
  name: 'cacheOrder',
  components: {
    Pagination
  },
  data() {
    return {
      dialogOrderInfoVisible: false,
      currentOrder: '',
      currentRow: 0,
      loading: false
    }
  },
  computed: {
    ...mapGetters([
      'username'
    ]),
    ...mapState({
      rows: state => state.terminal.cacheOrder,
      total: state => state.terminal.cacheOrder.length
    })
  },
  created() {
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
    this.resetCurrentRow()
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    // 1 or -1 上下选择行
    handerCurrentRow(value) {
      if (value > 0 && this.rows.length - 1 > this.currentRow) {
        this.currentRow = this.currentRow + value
      }
      if (value < 0 && this.currentRow > 0) {
        this.currentRow = this.currentRow + value
      }
      this.setCurrentRow(this.currentRow)
    },
    // 重置选择行
    resetCurrentRow(value = 0) {
      this.currentRow = value
      this.setCurrentRow(this.currentRow)
    },
    // 设置选择航
    async setCurrentRow(value) {
      this.$refs.table.setCurrentRow(this.rows[value])
      if (this.rows[value]) {
        this.currentOrder = this.rows[value]
        // this.currentOrder = this.currentOrder
      }
    },
    async handerOrderInfo() { // 显示订单详情
      this.dialogOrderInfoVisible = true
      // this.currentOrder = this.currentOrder
    },
    // 取出挂单
    handerPull() {
      console.log('取出挂单', this.currentOrder, this.currentRow)
    },
    // 删除挂单
    handerDelete() {
      console.log('删除挂单', this.currentOrder, this.currentRow)
    },
    keydown(e) {
      if (e.key === 'ArrowUp') { // 向上
        this.handerCurrentRow(-1)
      }
      if (e.key === 'ArrowDown') { // 向下
        this.handerCurrentRow(1)
      }
      if (e.key === '0') { // 订单详情
        this.handerPull()
      }
      if (e.key === '1') { // 订单详情
        this.handerOrderInfo()
      }
      if (e.key === '2' && this.currentOrder) { // 删除订单
        this.$confirm('是否删除此挂单, 是否继续?【高危】', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.handerDelete()
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
      }
    },
    destroyed() {
    }
  }
}
</script>

<style lang="less" scoped>
  @import "~@/assets/less/atom/syntax-variables.less";
  .container {
      margin: 1vw;
  }
  .button{
    padding: 0px 16px;
  }
  .el-table /deep/ .el-table__body tr.current-row>td{
    font-size:12px;
    color:#409EFF;
    // font-weight:900;
  }
  .black-info {
    height: 40px;
    padding: 1vw;
    border-radius:4px;
    background-color: #303133;
    color: #ffffff;
    height: 100%;
    padding: 13px;
    font-size: 10px;
  }
  .orderInfo{
    display: flex;
    flex-direction: column;
    span{
      margin-bottom: 1vh;
      font-size: 2.1vh;
    }
  }
</style>
