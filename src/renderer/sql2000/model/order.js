const Sequelize = require('sequelize')
import { parseTime, addPreZero } from '@/utils/index'
import { GoodsSnapshot } from '@/model/api/order'
import sequelizePay from '@/model/pay'
import connection from '@/sql2000/model/connection'
const pool = connection.Pool()
import store from '@/store'
import log from '@/utils/log'

const order = {
  sql: '',
  CreateOrderSQL(item) {
    const XsDate = parseTime(item.dataValues.createdAt, '{y}-{m}-{d}') // 销售日期
    const XsTime = parseTime(item.dataValues.createdAt, '{h}:{i}:{s}') // 销售时间
    const SaleItemNo = item.dataValues.orderNo // 销售流水号
    const UserCode = item.dataValues.userId // 收款员编号
    const CurrDate = parseTime(item.dataValues.createdAt, '{y}{m}{d}')
    const BcCode = 1 // 班次
    const TranType = item.dataValues.type ? 1 : 3 // 交易类型 [1、销货 2、作废销货 3、退货] 4、作废退货
    const XfType = 0 // 消费类型 [0、普通消费 1、会员消费]
    const YsAmt = (item.dataValues.total / 100).toFixed(2)// 应收金额
    const YhAmt = 0 // 优惠金额
    const SsAmt = YsAmt - YhAmt // 实收金额
    const SfAmt = (item.dataValues.getAmount / 100).toFixed(2) // 实付金额
    const CardCode = '' // 会员卡号
    const ReasonCode = ''
    const ZfTag = 0 // 作废 [0、正常 1、作废]
    const Tag = 0 //
    const CustType = 0 // 个人购物 [0、个人购物 1、大宗购物]

    this.sql = this.sql + ` INSERT INTO tXsTranItem(XsDate, XsTime, SaleItemNo, OldItemNo, UserCode, CurrDate, BcCode,  TranType, XfType, YsAmt, YhAmt, SsAmt, SfAmt, CardCode, ReasonCode, ZfTag, Tag, CustType)
          values('` + XsDate + `','` + XsTime + `','` + SaleItemNo + `', '', '` + UserCode + `','` + CurrDate + `','` + BcCode + `', '` + TranType + `','` + XfType + `','` + YsAmt + `','` + YhAmt + `','` + SsAmt + `','` + SfAmt + `','` + CardCode + `','` + ReasonCode + `','` + ZfTag + `','` + Tag + `','` + CustType + `') `
  },
  async CreateOrderGoodsSQL(item) {
    const XsDate = parseTime(item.dataValues.createdAt, '{y}-{m}-{d}') // 销售日期
    const XsTime = parseTime(item.dataValues.createdAt, '{h}:{i}:{s}') // 销售时间
    const SaleItemNo = item.dataValues.orderNo // 销售流水号
    const UserCode = item.dataValues.userId // 收款员编号
    const CurrDate = parseTime(item.dataValues.createdAt, '{y}{m}{d}')
    const BcCode = 1 // 班次
    const ClerkCode = '' // 营业员编码
    const PageNo = 1 // 页号
    const TranType = item.dataValues.type ? 1 : 3 // 交易类型 [1、销货 2、作废销货 3、退货] 4、作废退货
    const XsType = 0 //
    const XfType = 0 // 消费类型 [0、普通消费 1、会员消费]
    const LrType = 0 // 数据来源 [0、正常 1、提帐]
    const GzXsDate = XsDate
    await GoodsSnapshot(item.goods) // 合并商品快照
    for (let index = 0; index < item.goods.length; index++) {
      const goods = item.goods[index]
      const price = (goods.price / 100).toFixed(2)
      const total = (goods.total / 100).toFixed(2)

      const LnNo = goods.no // 行号
      const XsCount = goods.number // 数量
      const SPrice = price// 售价
      const FsPrice = price// 发生价
      const YsAmt = total // 应收金额
      const YhAmt = 0 // 优惠金额
      const SsAmt = total - YhAmt // 实收金额
      const HyPrice = goods.HyPrice // 会员价

      const PluCode = goods.pluCode // 商品ID
      const BarCode = goods.barCode // 商品条形码
      const PluName = goods.name // 商品名称
      const PluAbbr = goods.name // 商品别名
      const DepCode = goods.depCode // 部门ID
      const ClsCode = goods.ClsCode // 品类ID
      const SupCode = goods.SupCode // 供应商ID
      const BrandCode = goods.BrandCode // 品牌ID
      const Unit = goods.unit // 单位
      const Spec = goods.spec // 规格
      const TaxRate = goods.JTaxRate // 销项税率
      const YhType = goods.YhType // 优惠类型 [0、无优惠 1、促销优惠 2、批量促销 3、限量促销 4、会员优惠 5、赠送优惠 6、单项优惠 7、交易优惠 8、逢双优惠 9、买赠促销(送) A、混合促销 B、局部超额优惠 C、整单超额优惠 D、整单超额换购 E、积分换购 F、买赠促销(买) G、电子秤(数量金额签) ]
      const MgType = goods.MgType //
      const IsDecimal = goods.IsDecimal // 十进制
      const Tag = goods.Tag
      const BakData1 = '' // 批号
      const BakData2 = '' // 厂家
      const BakData3 = 0 // 备用信息

      this.sql = this.sql + ` INSERT INTO tXsPluItem(XsDate, XsTime,  SaleItemNo, UserCode, CurrDate, BcCode, ClerkCode, PageNo, LnNo, TranType, 
      XsType, XfType, LrType, GzXsDate, PluCode, BarCode, PluName, PluAbbr, DepCode, ClsCode, SupCode, BrandCode, Unit, Spec, 
      TaxRate, SPrice, HyPrice, FsPrice, XsCount, YsAmt, YhAmt, SsAmt, YhType, MgType, IsDecimal, Tag, BakData1, BakData2, BakData3)
          values('` + XsDate + `','` + XsTime + `','` + SaleItemNo + `','` + UserCode + `','` + CurrDate + `','` + BcCode + `','` + ClerkCode + `','` + PageNo + `','` + LnNo + `','` + TranType + `',
          '` + XsType + `','` + XfType + `','` + LrType + `','` + GzXsDate + `','` + PluCode + `','` + BarCode + `','` + PluName + `','` + PluAbbr + `','` + DepCode + `','` + ClsCode + `','` + SupCode + `','` + BrandCode + `','` + Unit + `','` + Spec + `',
          '` + TaxRate + `','` + SPrice + `','` + HyPrice + `','` + FsPrice + `','` + XsCount + `','` + YsAmt + `','` + YhAmt + `','` + SsAmt + `','` + YhType + `','` + MgType + `','` + IsDecimal + `','` + Tag + `','` + BakData1 + `','` + BakData2 + `','` + BakData3 + `') `

      // 数据库 INSERT end
    }
    // 商品循环 end'
  },
  async CreateOrderPaySQL(item) {
    // 获取全部支付方式
    const Pays = {}
    await sequelizePay.models.pay.findAll().then(res => {
      res.forEach(element => {
        let type = 0
        switch (element.type) {
          case 'cashPay':
            type = 0
            break
          case 'cardPay':
            type = 1
            break
          case 'remoteCardPay':
            type = 4
            break
          case 'scanPay':
            type = 6
            break
        }
        Pays[element.id] = {
          name: element.name,
          type: type
        }
      })
    })
    item.pays.forEach((pay, index) => {
      if (pay.status) {
        const payType = Pays[pay.payId].type
        const getAmount = (pay.getAmount / 100).toFixed(2)
        const amount = (pay.amount / 100).toFixed(2)
        const XsDate = parseTime(item.dataValues.createdAt, '{y}-{m}-{d}') // 销售日期
        const XsTime = parseTime(item.dataValues.createdAt, '{h}:{i}:{s}') // 销售时间
        const SaleItemNo = item.dataValues.orderNo // 销售流水号
        const UserCode = item.dataValues.userId // 收款员编号
        const CurrDate = parseTime(item.dataValues.createdAt, '{y}{m}{d}')
        const BcCode = 1 // 班次
        const TranType = item.dataValues.type ? 1 : 3 // 交易类型 [1、销货 2、作废销货 3、退货] 4、作废退货
        const SkNo = index + 1 // 支付序号
        const ZfCode = addPreZero(pay.payId, 4) // 支付代码 补全4位
        const ZfName = Pays[pay.payId].name //
        const ZfType = payType //
        const MoneyCode = '00' //
        const MoneyName = '人民币' //
        const HlRate = 100 //
        const CardCode = (payType === 1 || payType === 4) ? pay.code : '' // 非本地会员卡或者远程会员卡付款时不上报code
        const ZfAmt = amount //
        const ZfAmtRmb = amount //
        const SfAmt = getAmount//
        const SfAmtRmb = getAmount //
        const Tag = 0 //
        this.sql = this.sql + ` INSERT INTO tXsSkItem(XsDate, XsTime, SaleItemNo, UserCode, CurrDate, BcCode, TranType, SkNo, ZfCode, ZfName, ZfType, MoneyCode, MoneyName, HlRate, CardCode, ZfAmt, ZfAmtRmb, SfAmt, SfAmtRmb, Tag)
          values('` + XsDate + `','` + XsTime + `','` + SaleItemNo + `','` + UserCode + `','` + CurrDate + `','` + BcCode + `','` + TranType + `','` + SkNo + `','` + ZfCode + `','` + ZfName + `','` + ZfType + `','` + MoneyCode + `','` + MoneyName + `','` + HlRate + `','` + CardCode + `','` + ZfAmt + `','` + ZfAmtRmb + `','` + SfAmt + `','` + SfAmtRmb + `','` + Tag + `') `
      }
    })
  },
  Create(item) {
    return new Promise(async(resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      this.sql = '' // 初始化 防止 sql重复
      this.CreateOrderSQL(item)
      await this.CreateOrderGoodsSQL(item) // 因为需要查询商品快照数据库所有异步
      await this.CreateOrderPaySQL(item)

      pool.DB.query(this.sql,
        { type: Sequelize.QueryTypes.INSERT }
      ).then(response => {
        this.OrderCheck(item).then(response => { // 增加订单校验
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      }).catch(error => {
        if (error.message === 'Validation error') {
          this.OrderCheck(item).then(response => { // 增加订单校验
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        } else {
          reject(error)
        }
      })
    })
  },
  OrderCheck(order) {
    const orderNo = order.dataValues.orderNo
    return new Promise(async(resolve, reject) => {
      const sql = `select SsAmt as orderTotal  from tXsTranItem  WHERE SaleItemNo='` + orderNo + `'
      select sum(XsCount) as goodsCount  from tXsPluItem  WHERE SaleItemNo='` + orderNo + `'
      select sum(ZfAmt) as payTotal  from tXsSkItem  WHERE SaleItemNo='` + orderNo + `'`

      pool.DB.query(sql,
        { type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        log.scope('sql2000.order.OrderCheck').info(JSON.stringify(response))
        const total = response[0]['orderTotal'] + response[2]['payTotal']
        const goodsCount = response[1]['goodsCount']
        // console.log(response, order)
        if (total.toFixed(2) !== (order.dataValues.total * 2 / 100).toFixed(2)) {
          reject(new Error(`订单总价校验错误。 <br>  
          总价:` + (response[0]['orderTotal']).toFixed(2) + `元<br>
          商品总价:` + (response[2]['payTotal']).toFixed(2) + `元<br>
          本地总价:` + (order.dataValues.total / 100).toFixed(2) + `元<br>`))
        }
        if (goodsCount.toFixed(2) !== order.dataValues.number.toFixed(2)) {
          reject(new Error('订单商品总数量校验错误'))
        }
        resolve(response)
      }).catch(error => {
        log.scope('sql2000.order.OrderCheck').error(JSON.stringify(error.message))
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
      update tXsTranItem set JzDate=XsDate where (JzDate is Null) and (substring(SaleItemNo,1,4)='` + terminal + `') 
      update tXsPluItem set JzDate=XsDate where (JzDate is Null) and (substring(SaleItemNo,1,4)='` + terminal + `') 
      update tXsSkItem set JzDate=XsDate where (JzDate is Null) and (substring(SaleItemNo,1,4)='` + terminal + `') 
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
