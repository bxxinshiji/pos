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
        <template slot="empty">未查询到录入</template>
        <el-table-column
          label="单号"
          prop="orderNo"
          width="175"
        >
        </el-table-column>
        <el-table-column
          label="用户"
          prop="operatorId"
          width="50"
        >
        </el-table-column>
        <el-table-column
          prop="totalAmount"
          label="支付金额"
          min-width="80"
        >
          <template slot-scope="scope">
            {{ (scope.row.totalAmount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="支付方式"
          min-width="75"
        >
          <template slot-scope="scope">
            <span slot="label">
              <span v-if="scope.row.method=='wechat'"><el-tag size="small" :class="scope.row.method"><svg-icon :icon-class="scope.row.method" :class="scope.row.method"/> 微信</el-tag></span>
              <span v-if="scope.row.method=='alipay'"><el-tag size="small" :class="scope.row.method"><svg-icon :icon-class="scope.row.method" :class="scope.row.method"/> 支付宝</el-tag></span>
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          min-width="70"
        >
          <template slot-scope="scope">
            <el-tag 
              v-if="Number(scope.row.status)===-1"
              size="small"
              type="danger"
            >订单关闭</el-tag>
            <el-tag 
              v-if="Number(scope.row.status)===0"
              size="small"
              type="warning"
            >待付款</el-tag>
            <el-tag 
              v-if="Number(scope.row.status)===1"
              size="small"
              type="success"
            >支付成功</el-tag>
            
          </template>
        </el-table-column>
        <el-table-column
          label="绑定订单"
          prop="buildOrderNo"
          width="115"
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
                  <el-button type="primary" @click="handerPayQuery(currentOrder)">
                    1 支付查询
                  </el-button>
                  <el-button type="warning" @click="handerLoadOrder(currentOrder)">
                    2 载入订单
                  </el-button>
            </div>
          </el-col>
          <!-- <el-col :span="15.5">
            <div class="black-info ">
                  快捷键: 1、支付查询  2、载入订单、 PgUp 首页、 PgDn 最后一页、← 上页、→ 下页、↑ 向上、↓ 向下
            </div>
          </el-col> -->
      </el-row>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { Query, RefundQuery, GetUserId } from '@/api/payBcbt'
import { List, StatusUpdate as StatusUpdatePayOrder } from '@/model/api/payOrder'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { GetById } from '@/model/api/pay'
import utilsPay from '@/utils/pay'
import log from '@/utils/log'
import PayBcbtStore from '@/utils/pay-bcbt-electron-store'
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
      promise: {},
      listQuery: {
        page: 1,
        limit: 10,
        order: [
          ['createdAt', 'DESC']
        ],
        where: {
        }
      },
      scanPayInfo: {
        id: '',
        name: '',
        type: ''
      },
      loading: false
    }
  },
  computed: {
    ...mapGetters([
      'username'
    ]),
    ...mapState({
      scanPayId: state => state.settings.scanPayId
    })
  },
  created() {
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
    this.getList()
    this.initScanPayInfo()
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    initScanPayInfo() {
      GetById(this.scanPayId).then(info => {
        this.scanPayInfo.id = info.id
        this.scanPayInfo.name = info.name
        this.scanPayInfo.type = info.type
      })
    },
    getList() {
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
    handerPayQuery(currentOrder) {
      log.h('info', 'pay.handerPayQuery', JSON.stringify(currentOrder))
      let userId = ''
      if (currentOrder.order.goods.length > 0) {
        userId = GetUserId(currentOrder.order.goods)
      }
      const order = {
        outTradeNo: currentOrder.orderNo
      }
      let QueryModel = Query
      if (currentOrder.totalAmount < 0) {
        QueryModel = RefundQuery
        order.outRefundNo = currentOrder.orderNo
      }
      QueryModel(order, userId).then(response => { // 远程支付查询开始
        const content = response.data.content
        switch (content.status) {
          case 'CLOSED':
            currentOrder.status = -1
            this.$notify({
              type: 'error',
              title: '订单已关闭',
              message: '订单已关闭或已退款'
            })
            StatusUpdatePayOrder(currentOrder.orderNo, -1)
            break
          case 'USERPAYING':
            currentOrder.status = 0
            this.$notify({
              type: 'warning',
              title: '等待用户付款中',
              message: utilsPay.error.detail || '等待用户付款中'
            })
            break
        }
        if (content.returnCode === 'SUCCESS' && content.status === 'SUCCESS') {
          currentOrder.status = 1
          this.$notify({
            type: 'success',
            title: '支付成功',
            message: '支付金额: ' + (content.totalFee / 100).toFixed(2) + ' 元'
          })
          StatusUpdatePayOrder(currentOrder.orderNo, 1)
          if (content.refundFee > 0) {
            setTimeout(() => {
              this.$notify({
                type: 'warning',
                title: '已退款金额',
                message: '退款金额: ' + (content.refundFee / 100).toFixed(2) + ' 元'
              })
            }, 100)
          }
        }
      }).catch(error => {
        const detail = error.response.data.detail
        this.$notify({
          type: 'error',
          title: '支付失败',
          message: detail
        })
      })
    },
    handerLoadOrder(currentOrder) {
      if (currentOrder.buildOrderNo !== '') {
        this.$message({
          type: 'error',
          message: '已绑定订单不允许载入'
        })
        return
      }
      if (Number(currentOrder.status) === 1) {
        log.h('info', 'pay.handerLoadOrder', JSON.stringify(currentOrder))
        const order = currentOrder.order
        let payId = this.scanPayInfo.id
        let payName = this.scanPayInfo.name
        if (currentOrder.order.goods.length > 0) {
          const userId = GetUserId(currentOrder.order.goods)
          if (userId !== '') {
            payName = '扫码'
            payId = PayBcbtStore.get('userPayType')
          }
        }
        order.pays.push({
          payId: payId, // 支付方式
          name: payName, // 支付方式名称
          type: this.scanPayInfo.type, // 支付方式
          code: currentOrder.authCode, // 会员卡
          amount: currentOrder.totalAmount, // 支付金额
          getAmount: currentOrder.totalAmount, // 收到的钱[现金可以多少其他不允许]
          orderNo: currentOrder.orderNo, // 支付宝、微信等支付指定订单单号[UUID生成]
          status: currentOrder.status // 现金支付时默认支付状态成功
        })
        this.$store.dispatch('terminal/changeLoadOrder', order)
        this.$router.push({ path: '/terminal/cashier' })
      } else {
        this.$message({
          type: 'warning',
          message: '未支付订单不允许载入'
        })
      }
    },
    keydown(e) {
      if (e.key === 'ArrowUp') { // 向上
        this.handerCurrentRow(-1)
      }
      if (e.key === 'ArrowDown') { // 向下
        this.handerCurrentRow(1)
      }
      if (e.key === '1' && this.currentOrder) { // 支付订单查询
        this.handerPayQuery(this.currentOrder)
      }
      if (e.key === '2' && this.currentOrder) { // 载入订单
        this.$confirm('是否载入订单, 是否继续?【请勿重复载入一个订单】', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.handerLoadOrder(this.currentOrder)
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '已取消载入'
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
    height: 30px;
    padding: 1vw;
    border-radius:4px;
    background-color: #303133;
    color: #ffffff;
    height: 100%;
    padding: 13px;
    font-size: 10px;
  }
  .wechat{
    color: #67C23A;
  }
  .alipay{
    color: #409EFF;
  }
</style>
