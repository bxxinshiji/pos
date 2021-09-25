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

export function sign(content) {
  const signData = GetSignContent(content)
  return GetSign(JSON.stringify(signData), PrivateKey)
}

export function VerifySign(response) {
  return VerifyContent(JSON.stringify(GetSignContent(response.data.content)), response.data.sign, ServerPublicKey)
}

export function AopF2F(bizContent) {
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/aopF2F',
      method: 'post',
      data: {
        appId: AppId,
        userId: UserId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: UserId,
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
export function Query(bizContent) {
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/query',
      method: 'post',
      data: {
        appId: AppId,
        userId: UserId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: UserId,
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

export function Refund(bizContent) {
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/refund',
      method: 'post',
      data: {
        appId: AppId,
        userId: UserId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: UserId,
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

export function RefundQuery(bizContent) {
  return new Promise((resolve, reject) => {
    request({
      url: ApiUrl + '/institution-api/trades/refundQuery',
      method: 'post',
      data: {
        appId: AppId,
        userId: UserId,
        signType: SignType,
        sign: sign({
          appId: AppId,
          userId: UserId,
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
