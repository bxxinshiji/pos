
const SQL2000SQL = import('@/sql2000/model/vip_card')

//  结账
export function Settle(pay) {
  return new Promise((resolve, reject) => {
    SQL2000SQL.then(sql => {
      sql.default.Pay(pay.code, pay.amount * 0.01).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    }).catch(error => {
      reject(error)
    })
  })
}
