<template>
  <div class="item">
      <table class="table" border="0" cellpadding="0" cellspacing="0">
        <tr class="head">
          <th style="min-width:55px"># {{String(goods.length)}}</th>
          <th style="min-width:110px">编码</th>
          <th style="min-width:180px">商品名称</th>
          <th style="min-width:100px">数量</th>
          <th style="min-width:100px">单价</th>
          <th style="min-width:100px">小计</th>
        </tr>       
        <goods-item v-for="(goods,index) in showGoods" :key="index" :active="index===(currentRow-differ)" :goods="goods"></goods-item>
    </table>
    <div class="foots">
      <el-badge :value="cacheOrder.length" :hidden="cacheOrder.length===0?true:false">
        <el-button type="info" class="cacheOrder" @click="handerCacheOrder">挂单/取单</el-button>
      </el-badge>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { md5Sign } from '@/utils/crypto'
import sequelize from '@/model/order'
import GoodsItem from './goods.vue'
const Snapshots = sequelize.models.snapshot
import log from '@/utils/log'

export default {
  name: 'goods',
  components: { GoodsItem },
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
      cacheOrder(state) {
        return state.terminal.cacheOrder
      },
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
    // 设置选择行
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
        const row = document.getElementsByClassName('head') // 获取元素
        if (row.length > 0) {
          clientHeight = row[0].clientHeight // 获取其中一个的高度
        }
        const table = document.getElementsByClassName('item')
        const showNumber = parseInt(table[0].clientHeight / clientHeight)
        if (showNumber > 0) {
          this.showNumber = showNumber - 1
        }
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
    async handler(goods) {
      const snapshot = JSON.parse(JSON.stringify(goods))
      // 删除快照不能保存的信息
      delete snapshot.total
      delete snapshot.number
      delete snapshot.createdAt
      delete snapshot.updatedAt
      // 计算商品 MD5
      const MD5 = md5Sign(JSON.stringify(snapshot))
      goods.snapshotId = MD5
      // 创建商品快照
      Snapshots.create({
        id: MD5,
        snapshot: snapshot
      })
    },
    // 增加商品
    async addGoods(goods) {
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
    },
    handerCacheOrder() {
      this.$emit('cacheOrder')
    }
  }
}
</script>

<style lang="less" scoped>
@import "~@/assets/less/atom/syntax-variables.less";
.item{
  height:72vh;
  border-bottom: 1px solid #ebeef5;
  .table{
    width:100%;
    .head{
      color: @el-warning;
      font-size:2.5vh;
      th{
        padding: 6px 0 6px 10px;
        text-align:left;
        line-height:3vh;
        border-bottom: 1px solid #ebeef5;
      }
    }
  }
}
.foots{
  z-index: 9999;
  position: fixed;
  .cacheOrder{
    font-size: (100vh/100vw)*3vw;
    font-weight: 900;
  }

  right: 2vw;
  bottom: 20vh;
}
</style>
