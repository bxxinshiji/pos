/**
 * config 获取系统配置
 */
const Sequelize = require('sequelize')
import connection from '@/sql2000/model/connection'
const pool = connection.Pool()
import store from '@/store'
const config = {
  // 获取全系统配置
  Get(options) {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`select OptValue from tBmXtCase where options='` + options + `'`,
        { type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default config
