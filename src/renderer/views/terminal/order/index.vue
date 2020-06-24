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
              size="medium"
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
              size="medium"
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
                  <el-button type="primary" @click="handerSyncOrder(currentOrder)">
                    2 发布订单
                  </el-button>
                  <el-button type="warning" @click="handerPrint(currentOrder)">
                    3 打印订单
                  </el-button>
            </div>
          </el-col>
          <el-col :span="15.5">
            <div class="black-info ">
                  快捷键: 2 发布、3 打印、 PgUp 首页、 PgDn 最后一页、← 上页、→ 下页、↑ 向上、↓ 向下
            </div>
          </el-col>
      </el-row>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { List, UpdateOrderNo } from '@/model/api/order'
import { syncOrder } from '@/api/order'
import { AddPrint } from '@/model/api/order'
import print from '@/utils/print'
const Order = import('@/api/order')
import log from '@/utils/log'
export default {
  name: 'Order',
  components: {
    Pagination
  },
  data() {
    return {
      currentOrder: '',
      currentRow: 0,
      total: 0,
      rows: null,
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
      List(this.listQuery).then(response => {
        this.total = response.count
        this.rows = response.rows
        this.resetCurrentRow(this.currentRow)
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
    setCurrentRow(value) {
      this.$refs.table.setCurrentRow(this.rows[value])
      if (this.rows[value]) {
        this.currentOrder = this.rows[value]
      }
    },
    handerPrint(currentOrder) {
      log.scope('order.handerPrint').info(JSON.stringify(currentOrder))
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
      log.scope('order.handerSyncOrder').info(JSON.stringify(currentOrder))
      syncOrder(currentOrder).then(response => { // 同步订单
        this.$notify({
          title: '订单发布成功',
          message: '订单:' + this.currentOrder.orderNo,
          type: 'success'
        })
        this.getList()
      }).catch(err => {
        this.$confirm(err, '订单发布失败,是否确认使用新订单编号？', {
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
    keydown(e) {
      if (e.key === 'ArrowUp') { // 向上
        this.handerCurrentRow(-1)
      }
      if (e.key === 'ArrowDown') { // 向下
        this.handerCurrentRow(1)
      }
      if (e.key === '1') { // 订单详情
        console.log(this.currentOrder)
      }
      if (e.key === '2' && this.currentOrder) { // 发布订单
        this.handerSyncOrder(this.currentOrder)
      }
      if (e.key === '3' && this.currentOrder) { // 打印订单
        this.handerPrint(this.currentOrder)
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
</style>
