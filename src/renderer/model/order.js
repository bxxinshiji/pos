const Sequelize = require('sequelize')
import path from 'path'
import { exePath } from '@/utils'
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(exePath('database'), '/order.sqlite'),
  logging: false
  // timezone: '+08:00'
})

sequelize.authenticate().then(() => {
  console.log('Connection order successfully.')
}).catch(err => {
  console.error('Unable to connect to the order database:', err)
})

// 订单
const Order = sequelize.define('order', {
  orderNo: { type: Sequelize.STRING, unique: true }, // 订单编号
  terminal: Sequelize.STRING, // 终端编号
  userId: Sequelize.STRING, // 用户ID
  type: Sequelize.INTEGER, // 订单样式 付款 退款等等
  number: Sequelize.DECIMAL, // 商品数量
  total: Sequelize.INTEGER, // 成交金额
  getAmount: Sequelize.INTEGER, // 付款金额 一般指实付金额找零之前 比如 付款100 找零20  这里字段记录100
  publish: Sequelize.BOOLEAN // 是否发布到服务器
}, {})

// 订单商品
const Goods = sequelize.define('good', {
  number: Sequelize.DECIMAL, // 商品数量
  price: Sequelize.INTEGER, // 商品价格
  total: Sequelize.INTEGER, // 小计
  no: Sequelize.INTEGER // 排列序号
}, {
  timestamps: false
})
Order.Goods = Order.hasMany(Goods, {
  onUpdate: 'cascade',
  onDelete: 'cascade',
  hooks: true
})
Goods.belongsTo(Order)

// 商品快照
const Snapshots = sequelize.define('snapshot', {
  id: { type: Sequelize.STRING, unique: true, primaryKey: true }, // 快照 MD5
  snapshot: { type: Sequelize.JSON } // 商品信息
}, {})
Snapshots.Goods = Snapshots.hasMany(Goods)
Goods.belongsTo(Snapshots)

// 订单支付详情
const Pays = sequelize.define('pay', {
  payId: Sequelize.INTEGER, // 支付方式ID
  code: Sequelize.STRING, // 会员卡号 支付码
  name: Sequelize.STRING, // 支付方式名称
  type: Sequelize.STRING, // 支付方式类型
  amount: Sequelize.INTEGER, // 支付金额
  getAmount: Sequelize.INTEGER, // 收款金额
  orderNo: Sequelize.STRING, // 第三方订单号
  status: Sequelize.BOOLEAN // 是否支付成功
}, {
  timestamps: false
})
Order.Pays = Order.hasMany(Pays, {
  onUpdate: 'cascade',
  onDelete: 'cascade',
  hooks: true
})
Pays.belongsTo(Order)

// 初始化数据模型
sequelize.sync({
  // force: true
})
export default sequelize
