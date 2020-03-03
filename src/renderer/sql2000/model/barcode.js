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

const barcodes = {
  // 获取全部条形码商品
  All: () => {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`select BarCode as barCode,PluCode as pluCode,PluName as name,Spec as spec from tbmMulBar`,
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
      await pool.DB.query(`select BarCode as barCode,PluCode as pluCode,PluName as name,Spec as spec from tbmMulBar WHERE PluCode=:PluCode`,
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
