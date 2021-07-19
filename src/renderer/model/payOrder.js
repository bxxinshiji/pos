const Sequelize = require('sequelize')
import path from 'path'
import { exePath } from '@/utils'
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(exePath('database'), '/payOrder.sqlite'),
  logging: false
  // timezone: '+08:00'
})

sequelize.authenticate().then(() => {
  console.log('Connection order successfully.')
}).catch(err => {
  console.error('Unable to connect to the order database:', err)
})

// 订单
sequelize.define('payOrder', {
  orderNo: { type: Sequelize.STRING, unique: true }, // 订单编号
  method: Sequelize.STRING, // 支付方式 alipay wechat
  authCode: Sequelize.STRING, // 付款码
  totalAmount: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }, // 付款金额 一般指实付金额找零之前 比如 付款100 找零20  这里字段记录100
  operatorId: Sequelize.STRING, // 终端编号
  terminalId: Sequelize.STRING, // 用户ID
  storeName: Sequelize.STRING, // 收款商户账号
  storeId: Sequelize.STRING, // 收款商户账号UUID
  title: Sequelize.STRING, // 订单名称
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  buildOrderNo: {
    type: Sequelize.STRING,
    defaultValue: ''
  }, // 绑定的订单编号
  order: Sequelize.JSON // 订单数据
}, {})

// 初始化数据模型
sequelize.sync({
  // force: true
})
export default sequelize
