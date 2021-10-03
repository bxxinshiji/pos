import store from '@/store'
import router from '@/router'
import { MessageBox, Message } from 'element-ui'
const Mousetrap = require('mousetrap')
require('@/utils/mousetrap-global-bind')
const OrderModel = import('@/model/api/order')
const Order = import('@/api/order')
import Pay from '@/model/pay'

const state = {
  order: {
    userId: '',
    terminal: '',
    orderNo: '',
    goods: [],
    pays: [],
    type: true, // true 正常 false 退货
    number: 0,
    total: 0,
    getAmount: 0,
    waitPay: 0, // 等待支付金额
    status: false, // 订单状态是否完结订单
    publish: false
  },
  cacheInputGoods: {}, // 缓存输入商品信息
  cacheOrder: [], //  挂单的缓存订单
  loadOrder: {}, // 加载订单 1、支付成功没有下单成功的订单重新加载 2、离开页面的订单进行缓存
  cacheGoods: {}, // 缓存自定义价格商品信息
  currentGoods: {}, // 商品列表页面选中的商品
  isInputPrice: false, // 自定义输入商品价格页面控制
  isPay: false, // 支付页面悬浮
  pays: [], // 支付类型 【现金、银行卡、扫码支付等】
  payAmount: 0,
  orderInfo: { // 订单汇总信息
    count: 0, // 总数
    returns: 0, // 退款
    total: 0, // 总金额
    publish: 0, // 未上报
    pays: [],
    payTotal: 0 // 实际扫码支付总金额
  },
  orderQueueErrorTime: 0, // 订单队列数
  syncTerminal: true // 是否允许同步终端
}

const mutations = {
  SET_ORDER: (state, order) => {
    state.order = order
  },
  SET_PAYS: (state, pays) => {
    state.pays = pays
  },
  SET_ORDER_KEY: (state, { key, value }) => { // 根据 key 设置订单参数
    state.order[key] = value
  },
  PUSH_CACHE_ORDER: (state) => { // 挂起订单
    state.cacheOrder.push(state.order)
  },
  PULL_CACHE_ORDER: (state) => { // 取出第一个订单
    state.order = state.cacheOrder.shift()
  },
  LOAD_ORDER: (state, loadOrder) => { // 加载订单
    state.loadOrder = loadOrder
  },
  PULL_LOAD_ORDER: (state, loadOrder) => { // 加载订单
    state.order = state.loadOrder
    state.loadOrder = {}
  },
  SET_CURRENT_GOODS: (state, goods) => { // 设置商品列表选中商品
    state.currentGoods = goods
  },
  IS_INPUT_PRICE: (state, visible) => { // 自定义输入商品价格页面控制
    state.isInputPrice = visible
  },
  CACHE_GOODS: (state, goods) => { // 缓存自定义价格商品信息
    state.cacheGoods = goods
  },
  CACHE_INPUT_GOODS: (state, { code, goods }) => { // 缓存输入商品信息
    state.cacheInputGoods[code] = JSON.parse(JSON.stringify(goods)) // 防止深拷贝
  },
  EMPTY_CACHE_INPUT_GOODS: (state) => { // 清空缓存
    state.cacheInputGoods = {}
  },
  IS_PAY: (state, visible) => { // 支付页面控制
    state.isPay = visible
  },
  PAY_AMOUNT: (state, amount) => { // 自定义输收款金额
    state.payAmount = amount
  },
  SET_ORDER_INFO: (state, orderInfo) => { // 自定义输收款金额
    state.orderInfo = orderInfo
  },
  SYNC_TERMINAL: (state, value) => { // 是否允许同步终端
    state.syncTerminal = value
  },
  SET_ORDER_QUEUE_ERROR_TIME: (state) => { // 设置订单队列数
    state.orderQueueErrorTime = new Date().getTime()
    console.log(state.orderQueueErrorTime)
  }

}

const actions = {
  changeInitOrder({ commit }, type) { // 自定义输入商品价格页面控制
    return new Promise((resolve, reject) => {
      const userId = store.state.user.username
      const terminal = store.state.settings.terminal
      Order.then(o => {
        o.OrderNo(terminal, type).then(order_no => {
          store.dispatch('terminal/changeCurrentGoods', {}) // 清空选中商品
          commit('SET_ORDER', {
            userId: userId,
            terminal: terminal,
            orderNo: order_no,
            goods: [],
            pays: [],
            type: 1,
            number: 0,
            total: 0,
            getAmount: 0,
            waitPay: 0,
            status: false, // 订单状态是否完结订单
            publish: false
          })
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    })
  },
  changeInitPays({ state, commit }) {
    Pay.models.pay.findAll().then(res => { // 初始化支付
      const pays = []
      res.forEach(item => {
        pays.push({
          id: String(item.id ? item.id : '0'),
          name: item.name ? item.name : '',
          key: store.state.settings.payKeyboard[item.id],
          type: item.type ? item.type : ''
        })
      })
      commit('SET_PAYS', pays)
    })
  },
  handerOrder({ state, commit }) { // 处理更新订单相关
    let number = 0
    let total = 0
    let getAmount = 0
    let waitPay = 0// 待支付
    let no = state.order.goods.length
    state.order.goods.forEach(good => {
      delete good.id // 删除 id 防止写入数据库出错
      good.no = no // 计算序号
      no--
      if (good.total) { // 计算总价或者数量
        good.number = Math.round(good.total / good.price * 100) / 100
      } else {
        good.total = good.number * good.price
      }
      if (!state.order.type && good.total > 0) { // 销货切换退货计算
        good.number = -good.number
        good.total = -good.total
      }
      if (state.order.type && good.total < 0) { // 退货切换销货计算
        good.number = -good.number
        good.total = -good.total
      }
      number = number + good.number
      total = waitPay = total + good.total
    })
    state.order.pays.forEach((pay, index) => {
      waitPay = waitPay - pay.amount
      getAmount = getAmount + pay.getAmount
    })
    commit('SET_ORDER_KEY', { key: 'number', value: Number(number.toFixed(2)) })
    commit('SET_ORDER_KEY', { key: 'total', value: total })
    commit('SET_ORDER_KEY', { key: 'getAmount', value: getAmount })
    commit('SET_ORDER_KEY', { key: 'waitPay', value: waitPay })
  },
  changeSetOrderkey({ commit }, { key, value }) { // 根据订单 key 修改订单
    commit('SET_ORDER_KEY', { key, value })
  },
  changeIsInputPrice({ commit }, visible) { // 自定义输入商品价格页面控制
    commit('IS_INPUT_PRICE', visible)
  },
  changeCacheGoods({ commit }, goods) { // 缓存自定义价格商品信息
    commit('CACHE_GOODS', goods)
  },
  setCacheInputGoods({ commit }, { code, goods }) { // 缓存输入商品信息
    commit('CACHE_INPUT_GOODS', { code, goods })
  },
  emptyCacheInputGoods({ commit }) { // 清空缓存输入商品信息
    commit('EMPTY_CACHE_INPUT_GOODS')
  },
  getCacheInputGoods({ state }, code) { // 获取缓存输入商品信息
    return state.cacheInputGoods[code]
  },
  changeIsPay({ commit }, visible) { // 支付页面控制
    commit('IS_PAY', visible)
  },
  changePayAmount({ commit }, amount) { // 自定义输收款金额
    if (amount < 0) {
      amount = 0
    }
    commit('PAY_AMOUNT', amount)
  },
  pushCacheOrder({ commit, state }) { // 挂起订单
    commit('PUSH_CACHE_ORDER')
    this.dispatch('terminal/changeInitOrder') // 初始化现有订单
  },
  pullCacheOrder({ commit }) { // 取出订单
    commit('PULL_CACHE_ORDER')
    const terminal = store.state.settings.terminal
    Order.then(o => {
      o.OrderNo(terminal).then(order_no => {
        commit('SET_ORDER_KEY', { key: 'userId', value: store.state.user.username })
        commit('SET_ORDER_KEY', { key: 'terminal', value: store.state.settings.terminal })
        commit('SET_ORDER_KEY', { key: 'orderNo', value: order_no })
      })
    })
  },
  changeLoadOrder({ commit }, loadOrder) { // 加载订单到缓存
    commit('LOAD_ORDER', loadOrder)
  },
  changePullLoadOrder({ commit, state }) { // 取出加载到缓存的订单
    const order = state.loadOrder
    const terminal = store.state.settings.terminal
    Order.then(o => {
      o.OrderNo(terminal).then(order_no => {
        order.userId = store.state.user.username
        order.terminal = store.state.settings.terminal
        order.orderNo = order_no
      })
    })
    commit('PULL_LOAD_ORDER')
  },
  changeCurrentGoods({ commit }, goods) { // 设置商品列表选中商品
    commit('SET_CURRENT_GOODS', goods)
  },
  changeOrderInfo({ commit }) {
    return new Promise((resolve, reject) => {
      OrderModel.then(m => {
        m.Info(store.state.user.username).then(info => {
          commit('SET_ORDER_INFO', info)
          resolve(info)
        }).catch(err => {
          reject(err)
        })
      }).catch(err => {
        reject(err)
      })
    })
  },
  handerSyncTerminal({ commit }, value) { // 是否允许同步终端
    commit('SYNC_TERMINAL', value)
  },
  registerGlobalShortcut() {
    const log = require('@/utils/log').default
    const shutDown = store.state.settings.Keyboard.shutDown
    Mousetrap.bindGlobal(shutDown.toLowerCase(), () => { // 主页 快捷键
      if (store.state.terminal.isPay) { // 支付中禁止操作
        Message({
          type: 'warning',
          message: '支付锁定中,请勿进行其他操作!'
        })
      } else {
        MessageBox.confirm('关闭计算机 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async() => {
          // 先退出在关机
          await store.dispatch('user/logout')
          router.push(`/login`)
          log.h('info', 'store.modules.terminal', shutDown + ' 关机')
          switch (process.platform) {
            case 'win32':
              require('child_process').exec('shutdown /s /t 0')
              break
            default:
              require('child_process').exec('sudo shutdown -h now')
              break
          }
        }).catch(() => {
          Message({
            type: 'info',
            message: '已取消关机'
          })
        })
      }
    })
  },
  changeOrderQueueErrorTime({ commit }) { // 更改订单队列数
    commit('SET_ORDER_QUEUE_ERROR_TIME')
  },
  unregisterGlobalShortcut() {
    // const KeyboardIndex = store.state.settings.Keyboard.index
    // Mousetrap.unbindGlobal(KeyboardIndex)
    const shutDown = store.state.settings.Keyboard.shutDown
    Mousetrap.unbindGlobal(shutDown.toLowerCase())
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
