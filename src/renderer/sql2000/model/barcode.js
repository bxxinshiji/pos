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

const barcodes = {
  // 获取全部条形码商品
  List: (updatedAt, endAt) => {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      let depRange = `b.DepCode != ''`
      if (store.state.settings.depRange) {
        depRange = 'b.DepCode between ' + store.state.settings.depRange.replace('-', ' AND ') + ' '
      }
      pool.DB.query(`
        select
          a.PluCode as pluCode,
          a.BarCode as barCode,
          a.XgDate as updatedAt,
          a.PluName as name,
          a.Spec as spec,
          b.PluAbbrName,
          b.Unit as unit,
          b.DepCode as depCode,
          b.SupCode,
          b.HJPrice,
          b.SPrice as price,
          b.WJPrice,
          b.HyPrice,
          b.PfPrice,
          b.PluStatus as status,
          b.IsWeight as type,
          b.ClsCode,
          b.BrandCode,
          b.JTaxRate,
          b.YhType,
          b.MgType,
          b.IsDecimal,
          b.Tag
        from tbmMulBar as a LEFT JOIN tBmPlu b ON a.PluCode=b.PluCode
        WHERE ` + depRange + ` AND b.PluStatus='1' AND PluStatus='0' And a.XgDate >= '` + parseTime(updatedAt, '{y}-{m}-{d} {h}:{i}:{s}') + `' And a.XgDate < '` + parseTime(endAt, '{y}-{m}-{d} {h}:{i}:{s}') + `'
          ORDER BY a.XgDate Asc
      `,
      { type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        response.forEach(items => {
          handerItem(items)
        })
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 获取全部条形码商品
  All: () => {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`select BarCode as barCode,PluCode as pluCode,PluName as name,Spec as spec,XgDate as updatedAt from tbmMulBar`,
        { type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        response.forEach(items => {
          handerItem(items)
        })
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 获取指定商品的所有条码信息
  Get: (replacements) => {
    return new Promise(async(resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      await pool.DB.query(`select BarCode as barCode,PluCode as pluCode,PluName as name,Spec as spec,XgDate as updatedAt from tbmMulBar WHERE PluCode=:PluCode`,
        { replacements: replacements, type: Sequelize.QueryTypes.SELECT }
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

export default barcodes
