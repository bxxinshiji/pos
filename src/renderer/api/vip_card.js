
const SQL2000SQL = import('@/sql2000/model/vip_card')

export function Get(code, type) {
  return new Promise((resolve, reject) => {
    SQL2000SQL.then(sql => {
      if (type === 'cardPay') {
        sql.default.Get(code).then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      }
      if (type === 'remoteCardPay') {
        sql.default.RemoteGet(code).then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      }
    }).catch(error => {
      reject(error)
    })
  })
}
/**
 * 会员卡支付
 * @param {*} code  会员卡id
 * @param {*} amount 会员卡支付金额
 * @param {*} type 支付类型【会员卡、远程会员卡】
 * @param {*} orderNo 订单编号
 * @param {*} payNo 订单支付序列
 */
export function Pay(code, amount, type, orderNo, payNo) {
  return new Promise((resolve, reject) => {
    SQL2000SQL.then(sql => {
      if (type === 'cardPay') {
        sql.default.Pay(code, amount).then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      }
      if (type === 'remoteCardPay') {
        sql.default.RemotePay(code, amount, orderNo, payNo).then(response => {
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      }
    }).catch(error => {
      reject(error)
    })
  })
}
