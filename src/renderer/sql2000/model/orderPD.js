
import { parseTime } from '@/utils/index'
import { GoodsSnapshot } from '@/model/api/orderPD'
const Sequelize = require('sequelize')
import connection from '@/sql2000/model/connection'
const pool = connection.Pool()
import store from '@/store'

const order = {
  sql: '',
  async CreateOrderSQL(orders) {
    for (let index = 0; index < orders.length; index++) {
      await this.CreateOrderGoodsSQL(orders[index])
    }
  },
  async CreateOrderGoodsSQL(item) {
    const XsDate = parseTime(item.dataValues.createdAt, '{y}-{m}-{d} {h}:{i}:{s}') // 销售日期
    const XsTime = parseTime(item.dataValues.createdAt, '{h}:{i}:{s}') // 销售时间
    const JzDate = parseTime(item.dataValues.createdAt, '{y}-{m}-{d} {h}:{i}:{s}') // 结账日期
    const SaleItemNo = item.dataValues.orderNo // 销售流水号
    const UserCode = item.dataValues.userId // 收款员编号
    const CurrDate = parseTime(item.dataValues.createdAt, '{y}{m}{d}')
    const ClerkCode = ' '
    const BcCode = 1 // 班次
    const PageNo = 1 // 页号

    await GoodsSnapshot(item.goods) // 合并商品快照
    for (let index = 0; index < item.goods.length; index++) {
      const goods = item.goods[index]
      const price = goods.price
      const total = (goods.total / 100).toFixed(2)

      const LnNo = goods.no // 行号
      const XsCount = goods.number // 数量
      const SPrice = price// 售价
      const YsAmt = total // 应收金额

      const PluCode = goods.pluCode // 商品ID
      const BarCode = goods.BarCode ? goods.BarCode : '' // 条码
      const PluName = goods.name // 商品名称
      const PluAbbr = goods.name // 商品别名
      const DepCode = goods.depCode // 部门ID
      const ClsCode = goods.ClsCode // 品类ID
      const SupCode = goods.SupCode // 供应商ID
      const BrandCode = ' '
      const Unit = goods.unit
      const Spec = goods.spec
      const TaxRate = goods.JTaxRate // 销项税率
      const MgType = goods.MgType //
      const IsDecimal = goods.IsDecimal // 十进制
      const Tag = goods.Tag ? goods.Tag : ''
      const BakData1 = ' ' // 备用信息
      const BakData2 = ' ' // 备用信息
      const BakData3 = 0 // 备用信息

      this.sql = this.sql + ` INSERT INTO tXsPosPD (XsDate ,XsTime ,JzDate, SaleItemNo ,UserCode ,CurrDate ,ClerkCode ,BcCode ,PageNo ,LnNo ,PluCode ,BarCode ,PluName ,PluAbbr ,DepCode ,ClsCode ,SupCode  ,BrandCode  ,Unit  ,Spec ,TaxRate ,SPrice ,XsCount ,YsAmt ,MgType ,IsDecimal ,Tag ,BakData1 ,BakData2 ,BakData3,IsGenDno ) 
        values ('` + XsDate + `', '` + XsTime + `','` + JzDate + `', '` + SaleItemNo + `', '` + UserCode + `', '` + CurrDate + `',  '` + ClerkCode + `', '` + BcCode + `', '` + PageNo + `', '` + LnNo + `', '` + PluCode + `', '` + BarCode + `', '` + PluName + `', 
          '` + PluAbbr + `', '` + DepCode + `', '` + ClsCode + `', '` + SupCode + `',  '` + BrandCode + `',  '` + Unit + `',  '` + Spec + `', '` + TaxRate + `', '` + SPrice + `', '` + XsCount + `', '` + YsAmt + `', '` + MgType + `', '` + IsDecimal + `', '` + Tag + `', '` + BakData1 + `', '` + BakData2 + `', '` + BakData3 + `','0') `
      // 数据库 INSERT end
    }
    // 商品循环 end'
  },
  Create(orders) {
    return new Promise(async(resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      this.sql = '' // 初始化 防止 sql重复
      await this.CreateOrderSQL(orders)
      pool.DB.query(this.sql,
        { type: Sequelize.QueryTypes.INSERT }
      ).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },
  SettleOrder() { // 结账订单
    return new Promise(async(resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      const terminal = store.state.settings.terminal
      const sql = `
      update tXsPosPD set JzDate=XsDate where (JzDate is Null) and (substring(SaleItemNo,1,4)='` + terminal + `') 
      `
      pool.DB.query(sql,
        { type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  }

}
export default order
