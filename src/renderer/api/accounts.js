
const SQL2000OrderSQL = import('@/sql2000/model/order')

//  结账
export function Settle() {
  return new Promise((resolve, reject) => {
    SQL2000OrderSQL.then(sql => {
      sql.default.SettleOrder().then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    }).catch(error => {
      reject(error)
    })
  })
}
