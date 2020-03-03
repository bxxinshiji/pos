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

const user = {
  // 获取全部用户
  All: () => {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`select UserCode as code, UserName as name, PassWd as password from tXsUser`,
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
  }
}

export default user
