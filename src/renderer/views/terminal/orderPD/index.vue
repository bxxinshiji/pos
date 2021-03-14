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
          label="单号"
          prop="orderNo"
          min-width="115"
        >
        </el-table-column>
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
             {{ scope.row.type?'盘点':'负数盘点' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="publish"
          label="发布"
          min-width="80"
        >
          <template slot-scope="scope">
            <el-tag 
              size="small"
              :type="scope.row.publish?'success':'danger'"
            >
             {{ scope.row.publish?'发布':'未发布' }}
            </el-tag>
          </template>
        </el-table-column>
         <el-table-column
          prop="print"
          label="打印"
          min-width="45"
        >
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="时间"
          min-width="135"
        >
         <template slot-scope="scope">
            {{ scope.row.createdAt | parseTime }}
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />
      <el-row>
          <el-col :span="8.5">
            <div class="button">
                  <el-button type="info" @click="handerOrderInfo(currentOrder)">
                    1 盘点订单详情
                  </el-button>
                  <el-button type="primary" @click="handerSyncOrder(currentOrder)">
                    2 发布盘点订单
                  </el-button>
                  <el-button type="warning" @click="handerPrint(currentOrder)">
                    3 打印盘点订单
                  </el-button>
                  <el-button v-if="username === '0000'" type="danger" @click="handerDelete(currentOrder)">
                    4 删除盘点订单
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
            <span>订单编号: {{ currentOrder.orderNo }}</span>
            <span>终端编号: {{ currentOrder.terminal }}</span>
            <span>收款用户: {{ currentOrder.userId }}</span>
            <span>订单类型: 
              <el-tag 
                size="mini"
                :type="currentOrder.type?'success':'warning'"
              >
              {{ currentOrder.type?'盘点':'负数盘点' }}
              </el-tag>
            </span>
          </el-col>
          <el-col :span="8" class="orderInfo">
            <span style="color: #67C23A">订单金额: {{ currentOrder.total?(currentOrder.total / 100).toFixed(2):(0).toFixed(2) }} 元</span>
            <span style="color: #409EFF">实际收款: {{ currentOrder.getAmount?(currentOrder.getAmount / 100).toFixed(2):(0).toFixed(2) }} 元</span>
            <span>商品数量: {{ currentOrder.number }}</span>
          </el-col>
          <el-col :span="8" class="orderInfo">
            <span>打印次数: {{ currentOrder.print }} 次</span>
            <span>创建时间: {{ currentOrder.createdAt | parseTime }}</span>
            <span>发布状况: 
              <el-tag 
                size="mini"
                :type="currentOrder.publish?'success':'danger'"
              >
              {{ currentOrder.publish?'发布':'未发布' }}
              </el-tag>
            </span>
          </el-col>
        </el-row>
        <el-table :data="currentOrder.goods" size="mini" max-height="380">
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
      </el-dialog>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { List, Delete, AddPrint, Publish, GoodsSnapshot } from '@/model/api/orderPD'
import { syncOrder } from '@/api/orderPD'
import print from '@/utils/print'
// const Order = import('@/api/orderPD')
import log from '@/utils/log'
export default {
  name: 'OrderPD',
  components: {
    Pagination
  },
  data() {
    return {
      dialogOrderInfoVisible: false,
      currentOrder: '',
      currentRow: 0,
      total: 0,
      rows: null,
      promise: {},
      listQuery: {
        page: 1,
        limit: 10,
        order: [
          ['publish', 'ASC'],
          ['id', 'DESC']
        ],
        where: {
          userId: this.$store.state.user.username
        }
      },
      loading: false
    }
  },
  computed: {
    ...mapGetters([
      'username'
    ]),
    ...mapState({
      terminal: state => state.settings.terminal
    })
  },
  created() {
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
    this.getList()
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    getList() {
      if (this.username === '0000') { // 管理员账号不进行用户筛选
        this.listQuery.where = {}
      }
      if (!this.loading) {
        this.loading = true
        List(this.listQuery).then(response => {
          const listQuery = JSON.stringify(this.listQuery)
          this.total = response.count
          this.rows = response.rows
          this.$nextTick(() => { // 渲染完成检测在锁定状态中请求参数是否更改
            setTimeout(() => {
              if (listQuery === JSON.stringify(this.listQuery)) {
                this.loading = false
              } else {
                this.loading = false
                this.getList()
              }
            }, 0) // 加入js线程最后的队列
          })
          this.resetCurrentRow(this.currentRow)
        }).catch(error => {
          console.log(error)
        })
      }
    },
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
        await GoodsSnapshot(this.currentOrder.goods) // 合并商品快照
        this.currentOrder = this.currentOrder
      }
    },
    handerPrint(currentOrder) {
      log.h('info', 'order.handerPrint', JSON.stringify(currentOrder))
      if (currentOrder.print > 0 && this.username !== '0000') { // 只能打印一次  0000管理员可以打印多次
        this.$notify({
          title: '无法重复打印,请联系管理员。',
          message: '订单已打印过,无法重复打印。',
          type: 'warning'
        })
        return
      }
      print.hander(currentOrder, true).then(response => {
        AddPrint(currentOrder).then(response => { // 增加打印次数
          this.getList()
        })
        this.$notify({
          title: '打印成功',
          message: '订单:' + this.currentOrder.orderNo,
          type: 'success'
        })
      }).catch(err => {
        switch (err.message) {
          case 'Can not find printer':
            err.message = '没有找到打印机设备'
            break
        }
        this.$notify({
          title: '打印失败',
          message: err.message,
          type: 'error',
          duration: 15000
        })
      })
    },
    handerSyncOrder(currentOrder) {
      log.h('info', 'order.handerSyncOrder', JSON.stringify(currentOrder))
      syncOrder(currentOrder).then(response => { // 同步订单
        currentOrder.publish = true
        Publish({ orderNo: currentOrder.orderNo })
        this.$notify({
          title: '订单发布成功',
          message: '订单:' + this.currentOrder.orderNo,
          type: 'success'
        })
        this.getList()
      }).catch(error => {
        this.$confirm(error.message, '订单发布失败？', {
          type: 'error',
          dangerouslyUseHTMLString: true,
          center: true
        }).then(() => {
          // Order.then(o => {
          //   o.OrderNo(this.terminal).then(order_no => {
          //     UpdateOrderNo(currentOrder.id, order_no).then(() => {
          //       this.getList()
          //     })
          //   })
          // })
        }).catch(() => {
        })
      })
    },
    handerDelete(currentOrder) {
      log.h('info', 'order.handerDelete', JSON.stringify(currentOrder))
      Delete({
        orderNo: currentOrder.orderNo
      }).then(response => {
        this.$notify({
          title: '删除发布成功',
          message: '订单:' + currentOrder.orderNo,
          type: 'success'
        })
        this.getList()
      }).catch(error => {
        log.h('error', 'order.handerDelete', JSON.stringify(error.message))
      })
    },
    async handerOrderInfo() { // 显示订单详情
      await GoodsSnapshot(this.currentOrder.goods) // 合并商品快照
      this.dialogOrderInfoVisible = true
      this.currentOrder = this.currentOrder
    },
    keydown(e) {
      if (e.key === 'ArrowUp') { // 向上
        this.handerCurrentRow(-1)
      }
      if (e.key === 'ArrowDown') { // 向下
        this.handerCurrentRow(1)
      }
      if (e.key === '1') { // 订单详情
        this.handerOrderInfo()
      }
      if (e.key === '2' && this.currentOrder) { // 发布订单
        this.handerSyncOrder(this.currentOrder)
      }
      if (e.key === '3' && this.currentOrder) { // 打印订单
        this.handerPrint(this.currentOrder)
      }
      if (e.key === '4' && this.currentOrder) { // 删除订单
        if (this.username !== '0000') {
          this.$message({
            type: 'warning',
            message: '没有删除订单权限'
          })
          return
        }
        this.$confirm('是否删除订单, 是否继续?【高危】', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.handerDelete(this.currentOrder)
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
  .el-table /deep/ .el-table__body tr.current-row>td,.el-table /deep/ .el-table__body tr.hover-row>td{
    color:#409EFF;
    font-size:13px;
    font-weight:900;
  }
  .button{
    padding: 0px 16px;
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
