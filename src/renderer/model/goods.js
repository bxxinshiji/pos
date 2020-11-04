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
const Goods = sequelize.define('good', {
  pluCode: { type: Sequelize.STRING, unique: true }, // PLU码 自编码
  barCode: { type: Sequelize.STRING }, // 终端编号
  depCode: { type: Sequelize.BIGINT }, // 部门编码
  price: { type: Sequelize.BIGINT }, // 名称
  name: { type: Sequelize.STRING }, // 名称
  unit: { type: Sequelize.STRING }, // 单位
  spec: { type: Sequelize.STRING }, // 规格
  type: { type: Sequelize.BIGINT }, // 商品类型(0、普通商品(固定价格)，1、总价可调商品(称重类等、输入总价自动计算数量))
  snapshot: { type: Sequelize.JSON } // 单位
  // editAt: Sequelize.DATE // 检查远程更新时间
}, {})

// barcode 多条码
const BarCodes = sequelize.define('barCode', {
  pluCode: { type: Sequelize.STRING }, // 自编码
  barCode: { type: Sequelize.STRING, unique: true }, // 终端编号
  name: { type: Sequelize.STRING }, // 名称
  spec: { type: Sequelize.STRING } // 规格
}, {})

Goods.BarCodes = Goods.hasMany(BarCodes)
BarCodes.Goods = BarCodes.belongsTo(Goods)

// 初始化数据模型
sequelize.sync({
  // force: true
})
// 通过条形码获取商品
sequelize.barcodeByGoods = (barcode) => {
  return new Promise((resolve, reject) => {
    sequelize.query(
      'SELECT a.*,b.barCode as b_barCode,b.name as b_name,b.spec as b_spec FROM goods a LEFT JOIN barCodes b ON a.pluCode=b.pluCode WHERE a.barCode=:barCode or b.barCode=:barCode ',
      {
        replacements: { barCode: barcode },
        plain: true,
        type: Sequelize.QueryTypes.SELECT
      }
    ).then(goods => {
      if (goods.b_barCode) {
        goods.barCode = goods.b_barCode
      }
      if (goods.b_name) {
        goods.name = goods.b_name
      }
      if (goods.b_spec) {
        goods.spec = goods.b_spec
      }
      if (goods.snapshot) {
        goods.snapshot = JSON.parse(goods.snapshot)
      }
      resolve(goods)
    }).catch(error => {
      reject(error)
    })
  })
}
sequelize.plucodeByGoods = (pluCode) => {
  return new Promise((resolve, reject) => {
    Goods.findOne({ where: { pluCode: pluCode }}).then(goods => {
      resolve(goods)
    }).catch(error => {
      reject(error)
    })
  })
}
export default sequelize
