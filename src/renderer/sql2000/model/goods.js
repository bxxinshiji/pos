const Sequelize = require('sequelize')
import connection from '@/sql2000/model/connection'
import { trim } from '@/utils'
const pool = connection.Pool()
import store from '@/store'
import { parseTime } from '@/utils/index'

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
  List(updatedAt, endAt) {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      let depRange = `DepCode != ''`
      if (store.state.settings.depRange) {
        depRange = 'DepCode between ' + store.state.settings.depRange.replace('-', ' AND ') + ' '
      }
      // sql  列表查询语句(状态启用商品)
      const sql = `
          select 
            PluCode as pluCode ,
            BarCode barCode,
            XgDate as updatedAt,
            PluName as name,
            Unit as unit,
            Spec as spec,
            DepCode as depCode,
            SPrice as price,
            PluStatus as status,
            IsWeight as type,
            SupCode,
            HJPrice,
            WJPrice,
            HyPrice,
            PfPrice,
            ClsCode,
            BrandCode,
            JTaxRate,
            YhType,
            MgType,
            IsDecimal,
            Tag
          from tBmPlu 
          WHERE ` + depRange + `AND PluStatus='1' AND XgDate >= '` + parseTime(updatedAt, '{y}-{m}-{d} {h}:{i}:{s}') + `' And XgDate < '` + parseTime(endAt, '{y}-{m}-{d} {h}:{i}:{s}') + `'
          ORDER BY XgDate Asc
      `

      pool.DB.query(sql,
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
