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
  id: { type: Sequelize.STRING, unique: true }, // 订单编号
  stauts: Sequelize.BOOLEAN, // 终端编号
  pay: Sequelize.JSON, // 支付数据
  order: Sequelize.JSON // 订单数据
}, {})

// 初始化数据模型
sequelize.sync({
  // force: true
})
export default sequelize
