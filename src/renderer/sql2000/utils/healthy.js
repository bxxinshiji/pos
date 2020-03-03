import connection from '@/sql2000/model/connection'

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
  }).catch(() => {
    status = false
  })
  return status
}
