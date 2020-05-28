import { Notification } from 'element-ui'
const { Op } = require('sequelize')
import store from '@/store'
import { All, Create, Publish } from '@/model/api/orderPD'
import { syncOrder } from '@/api/orderPD'
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
    if (self.order.goods.length) {
      Create(self.order).then(orderRes => {
        self.order.status = true // 订单完结
        self.$refs.foots.information() // 更新info
      }).catch(error => {
        Notification({
          title: '创建订单错误',
          message: error.message,
          type: 'error',
          duration: 15000
        })
      })
    } else {
      self.$confirm('上传未上报盘点数据', '上传盘点数据', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const createdAt = { // 获取当天订单
          [Op.lt]: new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1),
          [Op.gt]: new Date(new Date(new Date().toLocaleDateString()).getTime())
        }
        All({
          createdAt: createdAt,
          publish: false
        }).then(orders => {
          if (orders.length > 0) {
            syncOrder(orders).then(() => {
              Publish({
                createdAt: createdAt,
                publish: false
              }).then(() => {
                self.$refs.foots.information() // 更新info
              })
              // Empty().then(() => {
              //   self.$refs.foots.information() // 更新info
              // })
              self.$message({
                type: 'success',
                message: '上传盘点订单数据成功'
              })
            }).catch(error => {
              Notification({
                title: '上传盘点订单数据错误',
                message: error,
                type: 'error',
                duration: 15000
              })
            })
          } else {
            self.$message({
              type: 'error',
              message: '盘点未上报订单数据为空'
            })
          }
        }).catch(error => {
          self.$message({
            type: 'error',
            message: '未找到盘点订单数据' + error
          })
        })
      }).catch(() => {
        self.$message({
          type: 'info',
          message: '已取消上传盘点数据'
        })
      })
    }
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
  pushPullOrder(self) { // 挂单取单
    if (self.order.goods.length > 0) {
      store.dispatch('terminal/pushCacheOrder')
    } else {
      if (store.state.terminal.cacheOrder.length >= 1) {
        store.dispatch('terminal/pullCacheOrder')
      } else {
        self.$message({
          type: 'warning',
          message: '订单为空无法挂起。'
        })
      }
    }
  }
}

export default hander
