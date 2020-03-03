const Sequelize = require('sequelize')
import path from 'path'
import { exePath } from '@/utils'
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(exePath('database'), '/pay.sqlite'),
  logging: false
  // timezone: '+08:00'
})

sequelize.authenticate().then(() => {
  console.log('Connection pay successfully.')
}).catch(err => {
  console.error('Unable to connect to the pay database:', err)
})

// pay 支付
sequelize.define('pay', {
  name: Sequelize.STRING, // 支付名字
  type: Sequelize.STRING // 支付类型
}, {})
// 初始化数据模型
sequelize.sync({
  // force: true
})

export default sequelize
