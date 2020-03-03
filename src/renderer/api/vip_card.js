
const SQL2000OrderSQL = import('@/sql2000/model/vip_card')

export function Get(code) {
  return new Promise((resolve, reject) => {
    SQL2000OrderSQL.then(sql => {
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
    SQL2000OrderSQL.then(sql => {
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
