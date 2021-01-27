const Sequelize = require('sequelize')
import { trim } from '@/utils'
import connection from '@/sql2000/model/connection'
const pool = connection.Pool()
import store from '@/store'
const vipCard = {
  // 查询会员卡
  Get: (code) => {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      var CardNo = code.substr(1, 13)
      var AmtCheck = code.substr(14, 21)
      pool.DB.query(`
        select * from tVipCardMaster WHERE CardNo=:CardNo
        select XsAmt=IsNull(sum(XsAmt), 0) from tVipCardDetailRemoteXf where CardCode=:CardNo 
        select ChgAmt=IsNull(sum(ChgAmt), 0) from tVipCardRemoteChg where CardCode=:CardNo 
      `,
      { replacements: { CardNo: CardNo }, type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        const item = response[0]
        if (trim(item.AmtCheck) !== trim(AmtCheck)) {
          reject(Error('会员卡校验失败'))
        }
        if (trim(item.CardStatus) !== '0') {
          reject(Error('会员卡状态不可用'))
        }
        resolve({
          cardNo: trim(item.CardNo),
          password: trim(item.Passwd),
          amount: item.ShopAmt - response[1].XsAmt, // 减去远程会员卡消费
          name: trim(item.VipName),
          id: Number(trim(item.ZfCode))
        })
      }).catch(error => {
        reject(error)
      })
    })
  },
  Pay: (code, amount) => {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      pool.DB.query(`
        select * from tVipCardMaster WHERE CardNo=:CardNo
      `,
      { replacements: { CardNo: code }, type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        const item = response[0]
        if (item.ShopAmt >= amount) {
          pool.DB.query(`
            update tVipCardMaster set ShopAmt = ShopAmt - :amount WHERE CardNo=:CardNo
          `,
          { replacements: { CardNo: code, amount: amount }, type: Sequelize.QueryTypes.UPDATE }
          ).then(response => {
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        } else {
          reject(Error('会员卡余额不足'))
        }
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default vipCard
