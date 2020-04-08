const Sequelize = require('sequelize')
import connection from '@/sql2000/model/connection'
import { trim } from '@/utils'
const pool = connection.Pool()
import store from '@/store'

// 删除字符串两边空格
function handerItem(items) {
  Object.keys(items).forEach(key => {
    if (typeof items[key] === 'string') {
      items[key] = trim(items[key])
    }
  })
}
const goods = {
  // 获取商品列表
  List(editAt) {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }

      // LIST_SQL  列表查询语句(状态启用商品)
      const LIST_SQL = `
          select 
            PluCode as pluCode ,
            BarCode barCode,
            XgDate as editAt,
            PluName as name,
            Unit as unit,
            Spec as spec,
            DepCode as depCode,
            SupCode,
            HJPrice,
            SPrice as price,
            WJPrice,
            HyPrice,
            PfPrice,
            PluStatus as status,
            IsWeight as type,
            ClsCode,
            BrandCode,
            JTaxRate,
            YhType,
            MgType,
            IsDecimal,
            Tag
          from tBmPlu 
          WHERE XgDate >= '` + editAt + `' AND PluStatus!=2 AND PluStatus!=3 AND PluStatus!=4 AND PluStatus!='A' AND PluStatus!='B'
          ORDER BY XgDate Asc
      `
      pool.DB.query(LIST_SQL,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      ).then(response => {
        response.forEach(items => {
          handerItem(items)
        })
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default goods
