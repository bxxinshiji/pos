import store from '@/store'
import escpos from '@/utils/escpos'
import { Message } from 'element-ui'

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
    store.dispatch('terminal/handerOrder')
    if (this.lockGoods) { // 商品添加锁
      self.$message({
        type: 'warning',
        message: '请等待商品添加完成,在尝试支付。'
      })
      return
    }
    if (!self.order.goods.length) {
      self.$message({
        type: 'warning',
        message: '未找到结账商品,请输入结账商品。'
      })
      return
    }
    const waitPay = self.order.waitPay
    if (waitPay === 0 && self.order.status) {
      self.$message({
        type: 'warning',
        message: '订单已完结,请勿重复付款。'
      })
      return
    }
    let amount = Math.round(self.getInput() * 100) // 四舍五入取整
    // 输入支付金额 (默认应收款金额)
    amount = (amount === 0 || isNaN(amount)) ? waitPay : amount
    if (amount - waitPay > 1000 * 100) { // 不允许实际收款大于代收款1000元。
      amount = 0
      self.$message({
        type: 'warning',
        message: '不允许实际收款大于代收款1000元。'
      })
      return
    }
    store.dispatch('terminal/changePayAmount', amount) // 开启支付页面的收款金额
    store.dispatch('terminal/changeIsPay', true) // 开启支付页面
    self.$message({
      type: 'success',
      message: '收款金额:' + (amount / 100).toFixed(2) + '元'
    })
    self.setInput()
  },
  addGoods(self) { // 添加商品可以条形码可以自编码
    const plucode = self.getInput()
    self.setInput()
    self.addGoods(plucode, true)
  },
  // 设置商品数量
  goodsNumber(self) {
    if (self.order.pays.length > 0) {
      self.$message({
        type: 'warning',
        message: '付款流程中禁止修改商品数量'
      })
      return
    }
    const number = Number(self.getInput()) // 转为数字防止输入0
    if (number) {
      if (self.order.goods.length > 0) {
        self.$refs.goods.setNumber(number)
        self.$message({
          type: 'success',
          message: '修改商品数量成功'
        })
      } else {
        self.MessageBox({
          title: '修改商品不存在',
          message: '请输入商品后在修改商品数量'
        })
        self.blur() // 失焦
      }
    } else {
      self.MessageBox({
        title: '请输入商品数量',
        message: '输入数量商品非法!'
      })
      self.blur() // 失焦
    }
    self.setInput()
  },
  // 删除指定商品
  deleteGoods(self) {
    if (self.order.pays.length > 0) {
      self.$message({
        type: 'warning',
        message: '付款流程中禁止删除商品'
      })
      return
    }
    self.$refs.goods.deleteGoods()
    self.$message({
      type: 'success',
      message: '删除指定商品成功'
    })
  },
  // 清空订单
  emptyOrder(self) {
    self.$confirm('此操作将情空全部商品和付款, 是否继续?', '提示', {
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
    if (self.order.pays.length > 0) {
      self.$message({
        type: 'warning',
        message: '付款流程中禁止退货'
      })
      return
    }
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
  pushPullOrder(self) { // 挂单取单
    if (self.order.goods.length > 0) {
      store.dispatch('terminal/pushCacheOrder')
    } else {
      if (store.state.terminal.cacheOrder.length >= 1) {
        // store.dispatch('terminal/pullCacheOrder')
        self.$router.push({ path: '/terminal/cacheOrder' })
      } else {
        Message({
          type: 'warning',
          message: '订单为空无法挂起。'
        })
      }
    }
  },
  cashdraw() { // '打开钱箱
    escpos.cashdraw().then(() => {
      Message({
        type: 'success',
        message: '打开钱箱成功'
      })
    }).catch((err) => {
      Message({
        type: 'error',
        message: '打开钱箱失败: ' + err.message
      })
    })
  }
}

export default hander
