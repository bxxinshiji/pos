const getmac = require('getmac')
import defaultSettings from '@/settings'
import Store from '@/utils/electron-store'
import PayBcbtStore from '@/utils/pay-bcbt-electron-store'
import { isServer } from '@/utils/healthy'

const { showSettings, fixedHeader, sidebarLogo, version } = defaultSettings

const state = {
  showSettings: showSettings,
  fixedHeader: fixedHeader,
  isHeader: true,
  sidebarLogo: sidebarLogo,
  version: version,
  // 自定义开发
  api: '', // baseURL集合每行一个回车分割
  baseURL: '', // 主API地址
  install: false, // 程序是否安装

  // 终端设置
  isTerminal: false, // 是否使用终端模式
  terminal: '', // 终端号
  macAddress: '', // mac 地址
  barcodeReg: '27PPPPPBBBBBC', // 条形码识别规则
  log: 100, // 日志大小默认10MB
  isTotal: false, // 总金额汇总显示【默认关闭】
  logSwitch: false, // 日志开关
  depRange: '', // 设置部门范围后 pos只能经营指定部门范围内的商品
  scanStoreName: '', // 支付商户用户名
  scanPayId: 0, //  扫码支付ID       必须大于0
  cardPayID: 0, // 会员卡支付ID   必须大于0
  dataExpires: 180, // 数据自动过期天数
  orderTitle: '扫码支付商品',
  printer: {
    switch: true,
    template: '           ******超市\n************* {{stuats}} *************\n编码    商品名称   数量   合计\n{{goods(pluCode|7,name|10,number|5,total|7)}}\n--------------------------------\n收款方式    应收金额    实收金额\n{{pays(name|12,amount|9,getAmount|9)}}\n--------------------------------\n收款员: {{userId}} 收款机: {{terminal}} \n金额: {{total}}元\n订单:{{orderNo}} 打印: {{print}} 次\n时间:{{createdAt}}\n地址:五路319号\n电话:010-2120888 ',
    accountsTemplate: '           当日交易汇总\n--------------------------------\n商户账号: {{storeId}}\n收款员: {{userId}} 收款机: {{terminal}} \n--------------------------------\n收款方式    金额\n{{pays(name|12,amount|9)}}\n--------------------------------\n实际扫码金额:{{payTotal}}\n订单: {{count}} 笔 退款: {{returns}}  笔\n未发布: {{publish}} 笔 \n时间:{{createdAt}}\n地址:五路319号\n电话:010-2120888 ',
    device: 'Win'
  },
  Keyboard: {
    currentRowUp: 'up', // 向上选择商品
    currentRowDown: 'down', // 向下选择商品
    shutDown: 'F1', // 关机
    cashdraw: 'F2', // 开钱箱
    pushPullOrder: 'F3', // 挂单取单快
    salesStatus: 'F4', // 销售状态(销货退货)
    deleteGoods: 'F5', // 删除选择商品
    emptyOrder: 'F6', // 清空商品
    goodsNumber: 'F7', // 商品数量
    addGoods: 'F8', // 添加商品可以条形码可以自编码
    pay: 'F9', // 支付缓存
    index: 'Home' // 主页
  }, // 键盘快捷键
  payKeyboard: {
    '0': 'F10',
    '1': '',
    '2': '',
    '3': '',
    '4': '',
    '5': '',
    '6': 'F11',
    '7': '',
    '8': '',
    '9': ''
  }, // 支付快捷键
  // sql2000
  shopCode: '001',
  sql2000_host: '',
  sql2000_port: '1433',
  sql2000_username: '',
  sql2000_password: '',
  sql2000_database: '',

  // 远程数据库

  cardRemoteSQL2000Host: '', // 会员卡远程服务器地址
  cardRemoteSQL2000Port: '1433',
  cardRemoteSQL2000Username: '', // 会员卡远程服务器用户名
  cardRemoteSQL2000Password: '', // 会员卡远程服务器密码
  cardRemoteSQL2000database: '', // 会员卡远程服务器数据库名

  // 扫码支付配置
  payBcbt: {
    api: '',
    userId: '',
    appId: '',
    privateKey: '',
    serverPublicKey: ''
  }
}

const mutations = {
  CHANGE_SETTING: (state, { key, value }) => {
    if (state.hasOwnProperty(key)) {
      state[key] = value
      Store.set('settings.' + key, value)
    }
  },
  // 自动更改可用服务器访问地址
  CHANGE_BASE_URL: (state) => {
    if (state.api) {
      state.api.split(/[\n]/).forEach(async url => {
        if (await isServer(url)) {
          mutations.CHANGE_SETTING(state, { key: 'baseURL', value: url })
        }
      })
    }
  }
}

const actions = {
  changeSetting({ commit }, data) {
    commit('CHANGE_SETTING', data)
  },
  changeBaseUrl({ commit }) {
    commit('CHANGE_BASE_URL')
  }
}

// init 初始化数据
function init() {
  state.api = Store.get('settings.api')
  // 初始化服务器地址
  mutations.CHANGE_BASE_URL(state)
  state.install = Store.get('settings.install')
  state.isTerminal = Store.get('settings.isTerminal')
  state.terminal = Store.get('settings.terminal')
  state.scanStoreName = Store.get('settings.scanStoreName')
  state.scanPayId = Store.get('settings.scanPayId')
  state.cardPayID = Store.get('settings.cardPayID')
  const dataExpires = Store.get('settings.dataExpires')
  if (dataExpires) {
    state.dataExpires = dataExpires
  }
  const orderTitle = Store.get('settings.orderTitle')
  if (orderTitle) {
    state.orderTitle = orderTitle
  }

  const barcodeReg = Store.get('settings.barcodeReg')
  if (barcodeReg) {
    state.barcodeReg = barcodeReg
  }
  const log = Store.get('settings.log')
  if (log) {
    state.log = log
  }
  const isTotal = Store.get('settings.isTotal')
  if (isTotal) {
    state.isTotal = isTotal
  }
  const logSwitch = Store.get('settings.logSwitch')
  if (logSwitch) {
    state.logSwitch = logSwitch
  }
  const depRange = Store.get('settings.depRange')
  if (depRange) {
    state.depRange = depRange
  }
  const printer = Store.get('settings.printer')
  if (printer) {
    state.printer = printer
  }
  const Keyboard = Store.get('settings.Keyboard')
  if (Keyboard) {
    state.Keyboard = Keyboard
  }
  const payKeyboard = Store.get('settings.payKeyboard')
  if (payKeyboard) {
    state.payKeyboard = payKeyboard
  }
  // 获取网卡地址
  getmac.getMac((err, macAddress) => {
    if (err) throw err
    mutations.CHANGE_SETTING(state, { key: 'macAddress', value: macAddress })
  })

  // sql2000
  const shopCode = Store.get('settings.shopCode') // 店铺编码  const cardRemoteSQL2000Port = Store.get('settings.cardRemoteSQL2000Port')
  if (shopCode) {
    state.shopCode = shopCode
  }
  state.sql2000_host = Store.get('settings.sql2000_host')
  state.sql2000_port = Store.get('settings.sql2000_port')
  state.sql2000_username = Store.get('settings.sql2000_username')
  state.sql2000_password = Store.get('settings.sql2000_password')
  state.sql2000_database = Store.get('settings.sql2000_database')
  // 远程会员sql2000
  state.cardRemoteSQL2000Host = Store.get('settings.cardRemoteSQL2000Host')
  const cardRemoteSQL2000Port = Store.get('settings.cardRemoteSQL2000Port')
  if (cardRemoteSQL2000Port) {
    state.cardRemoteSQL2000Port = cardRemoteSQL2000Port
  }
  state.cardRemoteSQL2000Username = Store.get('settings.cardRemoteSQL2000Username')
  state.cardRemoteSQL2000Password = Store.get('settings.cardRemoteSQL2000Password')
  state.cardRemoteSQL2000database = Store.get('settings.cardRemoteSQL2000database')

  // 支付信息
  state.payBcbt.api = PayBcbtStore.get('pay.api')
  state.payBcbt.appId = PayBcbtStore.get('pay.appId')
  state.payBcbt.userId = PayBcbtStore.get('pay.userId')
  state.payBcbt.privateKey = PayBcbtStore.get('pay.privateKey')
  state.payBcbt.serverPublicKey = PayBcbtStore.get('pay.serverPublicKey')
}
// 初始化数据
init()
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
