import connection from '@/sql2000/model/connection'
const Sequelize = require('sequelize')
import { syncDateTime } from '@/utils/healthy'

/**
 * Sql2000 数据库状态
 * @returns {Promise}
 */
export async function isSql2000(config) {
  let status = false
  if (config) {
    connection.Pool(config)
  }
  await connection.DB.authenticate().then(() => {
    status = true
  }).catch((error) => {
    console.log(error)

    status = false
  })
  return status
}

export async function syncTime() {
  const pool = connection.Pool()
  return new Promise((resolve, reject) => {
    pool.DB.query(`select getdate() as date`,
      { type: Sequelize.QueryTypes.SELECT }
    ).then(response => {
      syncDateTime(response[0].date)
    }).catch(error => {
      reject(error)
    })
  })
}
