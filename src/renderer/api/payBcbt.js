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
  // 计算五分钟前的时间
  const fiveMinutesAgo = new Date()
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 120)
  List({
    where: { // 自动同步最近5分钟内未成功的订单,
      createdAt: {
        [Op.gt]: fiveMinutesAgo
      },
      [Op.or]: [
        { status: 0 },
        { status: null }
      ]
    }
  }).then(response => {
    if (response.count > 0) {
      const rows = response.rows
      let userId = ''
      rows.forEach(res => {
        userId = GetUserId(res.order.goods)
        Query({
          outTradeNo: res.orderNo
        }, userId).then(response => { // 远程支付查询开始
          const content = response.data.content
          switch (content.order.status) {
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
