import request from '@/utils/request'
import PayBcbtStore from '@/utils/pay-bcbt-electron-store'
import { GetSign, GetSignContent, VerifyContent } from '@/utils/sign'
const { Op } = require('sequelize')
import { List, StatusUpdate as StatusUpdatePayOrder } from '@/model/api/payOrder'

const ApiUrl = PayBcbtStore.get('pay.api')
const SignType = 'RSA2'
const AppId = PayBcbtStore.get('pay.appId')
const UserId = PayBcbtStore.get('pay.userId')
const PrivateKey = '-----BEGIN RSA PRIVATE KEY-----\n' + PayBcbtStore.get('pay.privateKey') + '\n-----END RSA PRIVATE KEY-----'
const ServerPublicKey = '-----BEGIN PUBLIC KEY-----\n' + PayBcbtStore.get('pay.serverPublicKey') + '\n-----END PUBLIC KEY-----'
const Users = PayBcbtStore.get('users')

export function sign(content) {
  const signData = GetSignContent(content)
  return GetSign(JSON.stringify(signData), PrivateKey)
}
// 是否所有商品部门一致
export function IsDepIsdentical(goods) {
  let dep = ''
  for (let i = 0; i < goods.length; i++) {
    const item = goods[i]
    if (dep === '') {
      dep = item.depCode
    }
    if (item.depCode !== dep) {
      return false
    }
  }
  return true
}
// 根据商品获取用户ID
export function GetUserId(goods) {
  let userId = ''
  if (Users.length > 0 && goods.length > 0) {
    Users.forEach(user => {
      user.depCode.forEach(code => {
        if (goods[0].depCode === code) {
          userId = user.userId
        }
      })
    })
  }
  return userId
}
export function VerifySign(response) {
  return VerifyContent(JSON.stringify(GetSignContent(response.data.content)), response.data.sign, ServerPublicKey)
}

export function AopF2F(bizContent, userId) {
  if (userId === '' || userId === undefined || userId === null) {
    userId = UserId
  }
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/aopF2F',
      method: 'post',
      data: {
        appId: AppId,
        userId: userId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: userId,
          signType: SignType,
          bizContent: bizContent
        }),
        bizContent: bizContent
      }
    }).then(response => {
      if (VerifySign(response)) {
        resolve(response)
      } else {
        reject(new Error('返回数据校验失败'))
      }
    }).catch(error => {
      reject(error)
    })
  })
}
export function Query(bizContent, userId) {
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/query',
      method: 'post',
      data: {
        appId: AppId,
        userId: userId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: userId,
          signType: SignType,
          bizContent: bizContent
        }),
        bizContent: bizContent
      }
    }).then(response => {
      if (VerifySign(response)) {
        resolve(response)
      } else {
        reject(new Error('返回数据校验失败'))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

export function Refund(bizContent, userId) {
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/refund',
      method: 'post',
      data: {
        appId: AppId,
        userId: userId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: userId,
          signType: SignType,
          bizContent: bizContent
        }),
        bizContent: bizContent
      }
    }).then(response => {
      if (VerifySign(response)) {
        resolve(response)
      } else {
        reject(new Error('返回数据校验失败'))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

export function RefundQuery(bizContent, userId) {
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/refundQuery',
      method: 'post',
      data: {
        appId: AppId,
        userId: userId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: userId,
          signType: SignType,
          bizContent: bizContent
        }),
        bizContent: bizContent
      }
    }).then(response => {
      if (VerifySign(response)) {
        resolve(response)
      } else {
        reject(new Error('返回数据校验失败'))
      }
    }).catch(error => {
      reject(error)
    })
  })
}

export function SyncPayOrder() { // 同步所有待付款订单状态
  List({
    where: {
      [Op.or]: [
        {
          status: 0
        }, { // 自动同步最近5分钟内未成功的订单
          status: { [Op.ne]: 1 },
          createdAt: { [Op.gt]: new Date(new Date() - 5 * 60 * 1000)
          }
        }]
    }
  }).then(response => {
    if (response.count > 0) {
      const rows = response.rows
      rows.forEach(res => {
        Query({
          orderNo: res.orderNo,
          storeName: res.storeName
        }).then(response => { // 远程支付查询开始
          const data = response.data
          switch (data.order.status) {
            case 'CLOSED':
              StatusUpdatePayOrder(res.orderNo, -1)
              break
            case 'USERPAYING':
              break
            case 'SUCCESS':
              StatusUpdatePayOrder(res.orderNo, 1)
              break
          }
        })
      })
    }
  })
}
