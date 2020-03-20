<template>
    <div class="container">
      <el-table
        ref="table"
        :data="rows"
        height="72vh"
        size="mini"
        highlight-current-row
      >
        <template slot="empty">未查询到录入</template>
        <el-table-column
          label="单号"
          prop="orderNo"
          min-width="115"
        >
        </el-table-column>
        <el-table-column
          prop="totalAmount"
          label="支付金额"
          min-width="80"
        >
          <template slot-scope="scope">
            {{ (scope.row.pay.totalAmount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="stauts"
          label="状态"
          min-width="70"
        >
          <template slot-scope="scope">
            <el-tag 
              size="medium"
              :type="scope.row.stauts?'success':'warning'"
            >
             {{ scope.row.stauts?'支付成功':'待付款' }}
            </el-tag>
          </template>
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
                  <el-button type="primary" @click="handerPayGet(currentOrder)">
                    1 支付查询
                  </el-button>
                  <el-button type="primary" @click="handerLoadOrder(currentOrder)">
                    2 载入订单
                  </el-button>
            </div>
          </el-col>
          <el-col :span="15.5">
            <div class="black-info ">
                  快捷键: 1、支付查询  2、载入订单  End 下一页、 PgUp 首页、 PgDn 最后一页、↑ 向上、↓ 向下
            </div>
          </el-col>
      </el-row>
    </div>
</template>

<script>
import { AopF2F } from '@/api/pay'
import errorPay from '@/utils/error-pay'
import { StautsUpdate as StautsUpdatePayOrder } from '@/model/api/payOrder'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { List } from '@/model/api/payOrder'
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
          ['createdAt', 'DESC']
        ],
        where: {
        }
      }
    }
  },
  computed: {
  },
  created() {
  },
  mounted() {
    this.toggleHeader(false)// 关闭打开头部
    document.addEventListener('keydown', this.keydown)
    this.getList()
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    toggleHeader(turn) {
      this.$store.dispatch('settings/changeSetting', { key: 'isHeader', value: turn })
    },
    getList() {
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
    MessageBox({ title, message }, type = 'error') {
      this.$confirm(message, title, {
        type: type,
        showCancelButton: false,
        showConfirmButton: false,
        dangerouslyUseHTMLString: true,
        center: true
      }).then(() => {
      }).catch(() => {
      })
    },
    handerPayGet(currentOrder) {
      const pay = currentOrder.pay
      AopF2F(pay).then(response => { // 远程支付开始
        if (response.data.valid) {
          currentOrder.stauts = response.data.valid
          StautsUpdatePayOrder(pay.orderNo, response.data.valid)
          this.$notify({
            type: 'success',
            title: '支付成功',
            message: '付款成功'
          })
        }
      }).catch(error => {
        let err = errorPay.hander(error, pay.method)
        if (err === 'USERPAYING') {
          err = '等待用户付款中'
        }
        this.$notify({
          type: 'error',
          title: '支付失败',
          message: err
        })
      })
    },
    handerLoadOrder(currentOrder) {
      console.log('载入订单等待开发')
    },
    keydown(e) {
      if (e.key === 'ArrowUp') { // 向上
        this.handerCurrentRow(-1)
      }
      if (e.key === 'ArrowDown') { // 向下
        this.handerCurrentRow(1)
      }
      if (e.key === '1' && this.currentOrder) { // 支付订单查询
        this.handerPayGet(this.currentOrder)
      }
      if (e.key === '2' && this.currentOrder) { // 载入订单
        this.handerLoadOrder(this.currentOrder)
      }
    },
    destroyed() {
      this.toggleHeader(true) // 重新打开头部
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
    font-size: 12px;
  }
</style>
