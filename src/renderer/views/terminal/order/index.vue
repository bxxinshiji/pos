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
          min-width="100"
        >
        </el-table-column>
        <el-table-column
          prop="userId"
          label="用户ID"
          min-width="80"
        >
        </el-table-column>
        <el-table-column
          prop="number"
          label="数量"
          min-width="50"
        >
         <template slot-scope="scope">
            {{ scope.row.number.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="total"
          label="总价"
          min-width="100"
        >
          <template slot-scope="scope">
            {{ (scope.row.total / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="type"
          label="状态"
          min-width="80"
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
          prop="createdAt"
          label="时间"
          min-width="120"
        >
         <template slot-scope="scope">
            {{ scope.row.createdAt | parseTime }}
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />
    </div>
</template>

<script>
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { List } from '@/model/api/order'

export default {
  name: 'Order',
  components: {
    Pagination
  },
  data() {
    return {
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
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      List(this.listQuery).then(response => {
        this.total = response.count
        this.rows = response.rows
      })
    }
  }
}
</script>

<style lang="less" scoped>
  @import "~@/assets/less/atom/syntax-variables.less";
  .container {
      margin: 1vw;
  }
</style>
