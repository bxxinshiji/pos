
const SQL2000SQL = import('@/sql2000/model/vip_card')

export function Get(code) {
  return new Promise((resolve, reject) => {
    SQL2000SQL.then(sql => {
      sql.default.Get(code).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    }).catch(error => {
      reject(error)
    })
  })
}
// 会员卡支付
export function Pay(pay) {
  return new Promise((resolve, reject) => {
    SQL2000SQL.then(sql => {
      sql.default.Pay(pay.code, (pay.amount / 100).toFixed(2)).then(response => {
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    }).catch(error => {
      reject(error)
    })
  })
}
