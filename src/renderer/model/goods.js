const Sequelize = require('sequelize')
import path from 'path'
import { exePath } from '@/utils'

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(exePath('database'), '/goods.sqlite'),
  logging: false
})

sequelize.authenticate().then(() => {
  console.log('Connection goods successfully.')
}).catch(err => {
  console.error('Unable to connect to the goods database:', err)
})

// 商品
sequelize.define('good', {
  index: { type: Sequelize.STRING, unique: true }, // 位置索引 默认 barcode 没用使用 plucode
  pluCode: { type: Sequelize.STRING }, // PLU码 自编码
  barCode: { type: Sequelize.STRING }, // 终端编号
  depCode: { type: Sequelize.BIGINT }, // 部门编码
  price: { type: Sequelize.BIGINT }, // 价格
  name: { type: Sequelize.STRING }, // 名称
  unit: { type: Sequelize.STRING }, // 单位
  spec: { type: Sequelize.STRING }, // 规格
  type: { type: Sequelize.BIGINT }, // 商品类型(0、普通商品(固定价格)，1、总价可调商品(称重类等、输入总价自动计算数量))
  // sql200 保存数据
  status: { type: Sequelize.STRING }, // 商品状态
  SupCode: { type: Sequelize.STRING }, // 供应商
  HJPrice: { type: Sequelize.BIGINT }, // 含税进价
  WJPrice: { type: Sequelize.BIGINT }, // 未税进价
  HyPrice: { type: Sequelize.BIGINT }, // 会员价
  PfPrice: { type: Sequelize.BIGINT }, // 批发价
  ClsCode: { type: Sequelize.STRING }, // 品类ID
  BrandCode: { type: Sequelize.STRING }, // 品牌ID
  JTaxRate: { type: Sequelize.STRING }, // 品牌ID
  YhType: { type: Sequelize.STRING }, // 优惠类型
  MgType: { type: Sequelize.STRING }, // 金额管理
  IsDecimal: { type: Sequelize.STRING }, // 十进制
  Tag: { type: Sequelize.STRING } // 标签
  // editAt: Sequelize.DATE // 检查远程更新时间
}, {
  indexes: [
    {
      fields: ['pluCode']
    },
    {
      fields: ['barCode']
    }
  ]
})

// 初始化数据模型
sequelize.sync({
  // force: true
})
export default sequelize
