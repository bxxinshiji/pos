<template>
    <div class="container">
      <el-table
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
             {{ scope.row.type?'销货':'退货' }}
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
                  <el-button type="info" @click="handerSyncOrder(currentOrder)">
                    1 订单详情
                  </el-button>
                  <el-button type="primary" @click="handerSyncOrder(currentOrder)">
                    2 发布订单
                  </el-button>
                  <el-button type="warning" @click="handerPrint(currentOrder)">
                    3 打印订单
                  </el-button>
                  <el-button v-if="username === '0000'" type="danger" @click="handerDelete(currentOrder)">
                    4 删除订单
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
            <span>收款用户: {{ currentOrder.userId }}</span>
            <span>订单类型: 
              <el-tag 
                size="mini"
                :type="currentOrder.type?'success':'warning'"
              >
              {{ currentOrder.type?'销货':'退货' }}
              </el-tag>
            </span>
          </el-col>
          <el-col :span="8" class="orderInfo">
            <span>订单金额: {{ currentOrder.total?(currentOrder.total / 100).toFixed(2):'' }} 元</span>
            <span style="color: #F56C6C">实际收款: {{ currentOrder.getAmount?(currentOrder.getAmount / 100).toFixed(2):'' }} 元</span>
            <span style="color: #409EFF">商品数量: {{ currentOrder.number }}</span>
          </el-col>
          <el-col :span="8" class="orderInfo">
            <span>终端编号: {{ currentOrder.terminal }}</span>
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
        <el-table :data="currentOrder.goods" size="mini" max-height="250">
          <el-table-column label="商品信息">
            <el-table-column property="pluCode" label="编码" width="100"></el-table-column>
            <el-table-column property="name" label="商品名称" width="130"></el-table-column>
            <el-table-column property="price" label="单价" width="100">
              <template slot-scope="scope">
              {{ (scope.row.price / 100).toFixed(2) }} 元
            </template>
            </el-table-column>
            <el-table-column property="number" label="数量" width="80"></el-table-column>
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
            <el-table-column property="payId" label="ID" width="50"></el-table-column>
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
import { List, Delete, UpdateOrderNo } from '@/model/api/order'
import { syncOrder } from '@/api/order'
import { AddPrint, GoodsSnapshot } from '@/model/api/order'
import print from '@/utils/print'
import { promise } from '@/utils/promise'
const Order = import('@/api/order')
import log from '@/utils/log'
export default {
  name: 'Order',
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
      }
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
      if (this.promise.hasOwnProperty('cancel')) { // 如果可以取消先取消
        this.promise.cancel()
      }
      this.promise = promise(List(this.listQuery))
      this.promise.then(response => {
        this.total = response.count
        this.rows = response.rows
        this.resetCurrentRow(this.currentRow)
      }).catch(error => {
        console.log('查询已经取消', error)
      })
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
        this.$notify({
          title: '订单发布成功',
          message: '订单:' + this.currentOrder.orderNo,
          type: 'success'
        })
        this.getList()
      }).catch(error => {
        this.$confirm(error.message, '订单发布失败,是否确认使用新订单编号？', {
          type: 'error',
          dangerouslyUseHTMLString: true,
          center: true
        }).then(() => {
          Order.then(o => {
            o.OrderNo(this.terminal).then(order_no => {
              UpdateOrderNo(currentOrder.id, order_no).then(() => {
                this.getList()
              })
            })
          })
        }).catch(() => {
        })
      })
    },
    handerDelete(currentOrder) {
      log.h('info', 'order.handerDelete', JSON.stringify(currentOrder))
      Delete(currentOrder).then(response => {
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
