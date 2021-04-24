const Sequelize = require('sequelize')
import { trim } from '@/utils'
import connection from '@/sql2000/model/connection'
const pool = connection.Pool()
import remoteConnection from '@/sql2000/model/remoteConnection' // 远程数据库
const remotePool = remoteConnection.Pool()
import store from '@/store'
import log from '@/utils/log'
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
        if (trim(item.CardCode) !== CardNo) {
          reject(Error('未找到此会员卡'))
        }
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
        select XsAmt=IsNull(sum(XsAmt), 0) from tVipCardDetailRemoteXf where CardCode=:CardNo 
        select ChgAmt=IsNull(sum(ChgAmt), 0) from tVipCardRemoteChg where CardCode=:CardNo 
      `,
      { replacements: { CardNo: code }, type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        const item = response[0]
        if (item.ShopAmt - response[1].XsAmt >= amount) {
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
          log.h('error', 'vip_card.Pay', JSON.stringify(response))
          reject(Error('会员卡余额不足' + JSON.stringify(response)))
        }
      }).catch(error => {
        reject(error)
      })
    })
  },
  // 远程查询会员卡
  RemoteGet: (code) => {
    return new Promise((resolve, reject) => {
      if (!store.state.healthy.isSql2000) {
        reject(Error('服务器断开！！(SQL2000服务器断开)'))
      }
      var CardNo = code.substr(1, 13)
      var AmtCheck = code.substr(14, 21)
      remotePool.DB.query(`
        select * from tVipCardMaster WHERE CardNo=:CardNo
        select XsAmt=IsNull(sum(XsAmt), 0) from tVipCardDetailRemoteXf where CardCode=:CardNo 
        select ChgAmt=IsNull(sum(ChgAmt), 0) from tVipCardRemoteChg where CardCode=:CardNo 
      `,
      { replacements: { CardNo: CardNo }, type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        const item = response[0]
        if (trim(item.CardCode) !== CardNo) {
          reject(Error('未找到此会员卡'))
        }
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
  // 远程会员卡支付
  RemotePay: (code, amount, orderNo, payNo) => {
    return new Promise((resolve, reject) => {
      const shopCode = store.state.settings.shopCode
      remotePool.DB.query(`
        select * from tVipCardMaster WHERE CardNo=:CardNo
        select XsAmt=IsNull(sum(XsAmt), 0) from tVipCardDetailRemoteXf where CardCode=:CardNo 
        select ChgAmt=IsNull(sum(ChgAmt), 0) from tVipCardRemoteChg where CardCode=:CardNo 
      `,
      { replacements: { CardNo: code }, type: Sequelize.QueryTypes.SELECT }
      ).then(response => {
        const item = response[0]
        if (item.ShopAmt - response[1].XsAmt >= amount) {
          remotePool.DB.query(`
            insert into tVipCardDetailRemoteXf(CardCode, ShopCode, SaleItemNo, SkNo, XsDate, XsAmt, IsCl)  values('` + code + `', '` + shopCode + `', '` + orderNo + `', '` + payNo + `', getdate(), '` + amount + `', '0')
          `,
          { type: Sequelize.QueryTypes.INSERT }
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
