import store from '@/store'
import { Message } from 'element-ui'
const { exec } = require('child_process')

const hander = {
  // 输入框聚焦
  inputFoots(self) {
    self.focus()
  },
  // 选择行向上
  currentRowUp(self) {
    self.$refs.goods.handerCurrentRow(-1)
  },
  // 选择行向下
  currentRowDown(self) {
    self.$refs.goods.handerCurrentRow(+1)
  },
  pay(self) {
    if (!self.order.goods.length) {
      self.$message({
        type: 'warning',
        message: '未找到结账商品,请输入结账商品。'
      })
      return
    }
    const waitPay = self.order.waitPay
    if (waitPay === 0) {
      self.$message({
        type: 'warning',
        message: '订单已完结,请勿重复付款。'
      })
      return
    }
    let amount = Math.floor(self.$refs.foots.input * 100)
    // 输入支付金额 (默认应收款金额)
    amount = (amount === 0) ? waitPay : amount
    store.dispatch('terminal/changePayAmount', amount) // 开启支付页面的收款金额
    store.dispatch('terminal/changeIsPay', true) // 开启支付页面
    self.$message({
      type: 'success',
      message: '收款金额:' + amount * 0.01 + '元'
    })
    self.$refs.foots.input = ''
  },
  addGoods(self) { // 添加商品可以条形码可以自编码
    const plucode = self.$refs.foots.input
    self.$refs.foots.input = ''
    self.addGoods(plucode, true)
  },
  // 设置商品数量
  goodsNumber(self) {
    const number = self.$refs.foots.input
    if (number) {
      if (self.order.goods.length > 0) {
        self.$refs.goods.setNumber(number)
        self.$refs.foots.input = ''
        self.$message({
          type: 'success',
          message: '修改商品数量成功'
        })
      } else {
        self.$message({
          type: 'error',
          message: '修改商品不存在'
        })
      }
    } else {
      self.$message({
        type: 'warning',
        message: '请输入修改数量'
      })
    }
  },
  // 删除指定商品
  deleteGoods(self) {
    self.$refs.goods.deleteGoods()
    self.$message({
      type: 'success',
      message: '删除指定商品成功'
    })
  },
  // 清空订单
  emptyOrder(self) {
    self.$confirm('此操作将情空全部商品, 是否继续?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 初始化订单数据
      self.initOrder()
      self.$message({
        type: 'success',
        message: '清空商品成功!'
      })
    }).catch(() => {
      self.$message({
        type: 'info',
        message: '已取消清空商品'
      })
    })
  },
  // 销售状态 销货|退货
  salesStatus(self) {
    const type = !self.order.type ? '销货' : '退货'
    self.$confirm('进入【' + type + '】状态, 是否继续?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      self.order.type = !self.order.type
      self.$message({
        type: 'success',
        message: '进入' + type + '状态'
      })
    }).catch(() => {
      self.$message({
        type: 'info',
        message: '取消进入' + type + '状态'
      })
    })
  },
  shutDown(self) { // 关机
    self.$confirm('关闭计算机 是否继续?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      switch (process.platform) {
        case 'win32':
          exec('shutdown /s /t 0')
          break
        default:
          exec('sudo shutdown -h now')
          break
      }
    }).catch(() => {
      self.$message({
        type: 'info',
        message: '已取消关机'
      })
    })
  },
  pushPullOrder(self) { // 挂单取单
    if (self.order.goods.length > 0) {
      store.dispatch('terminal/pushCacheOrder')
    } else {
      if (store.state.terminal.cacheOrder.length >= 1) {
        store.dispatch('terminal/pullCacheOrder')
      } else {
        Message({
          type: 'warning',
          message: '订单为空无法挂起。'
        })
      }
    }
  }
}

export default hander
