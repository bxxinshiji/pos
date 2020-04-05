import store from '@/store'
const { Op } = require('sequelize')
import sequelize from '@/model/order'
const Order = sequelize.models.order
import { OrderNo } from '@/api/order'

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
  cacheGoods: {}, // 缓存自定义价格商品信息
  currentGoods: {}, // 商品列表页面选中的商品
  cacheOrder: [], //  挂单的缓存订单
  isInputPrice: false, // 自定义输入商品价格页面控制
  isPay: false, // 支付页面悬浮
  payAmount: 0,
  orderInfo: { // 订单汇总信息
    count: 0, // 总数
    returns: 0, // 退款
    total: 0, // 总金额
    publish: 0// 未上报
  }
}

const mutations = {
  SET_ORDER: (state, order) => {
    state.order = order
  },
  SET_ORDER_KEY: (state, { key, value }) => { // 根据 key 设置订单参数
    if (state.order.hasOwnProperty(key)) {
      state.order[key] = value
    }
  },
  PUSH_CACHE_ORDER: (state) => { // 挂起订单
    state.cacheOrder.push(state.order)
  },
  PULL_CACHE_ORDER: (state) => { // 取出第一个订单
    state.order = state.cacheOrder.shift()
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
  IS_PAY: (state, visible) => { // 自定义输入商品价格页面控制
    state.isPay = visible
  },
  PAY_AMOUNT: (state, amount) => { // 自定义输收款金额
    state.payAmount = amount
  },
  SET_ORDER_INFO: (state, { key, value }) => { // 自定义输收款金额
    if (state.orderInfo.hasOwnProperty(key)) {
      state.orderInfo[key] = value
    }
  }
}

const actions = {
  changeInitOrder({ commit }, type) { // 自定义输入商品价格页面控制
    return new Promise((resolve, reject) => {
      const userId = store.state.user.username
      const terminal = store.state.settings.terminal
      OrderNo(terminal, type).then(order_no => {
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
      if (!state.order.type && good.number > 0) { // 销货切换退货计算
        good.number = -good.number
        good.total = -good.total
      }
      if (state.order.type && good.number < 0) { // 退货切换销货计算
        good.number = -good.number
        good.total = -good.total
      }
      number = number + good.number
      total = waitPay = total + good.total
    })
    state.order.pays.forEach(pay => {
      waitPay = waitPay - pay.amount
      getAmount = getAmount + pay.getAmount
    })
    commit('SET_ORDER_KEY', { key: 'number', value: number })
    commit('SET_ORDER_KEY', { key: 'total', value: total })
    commit('SET_ORDER_KEY', { key: 'getAmount', value: getAmount })
    commit('SET_ORDER_KEY', { key: 'waitPay', value: waitPay })
  },
  changeSetOrderkey({ commit }, key, value) { // 根据订单 key 修改订单
    commit('SET_ORDER_KEY', { key, value })
  },
  changeIsInputPrice({ commit }, visible) { // 自定义输入商品价格页面控制
    commit('IS_INPUT_PRICE', visible)
  },
  changeCacheGoods({ commit }, goods) { // 缓存自定义价格商品信息
    commit('CACHE_GOODS', goods)
  },
  changeIsPay({ commit }, visible) { // 自定义输入商品价格页面控制
    commit('IS_PAY', visible)
  },
  changePayAmount({ commit }, amount) { // 自定义输收款金额
    commit('PAY_AMOUNT', amount)
  },
  pushCacheOrder({ commit, state }) { // 挂起订单
    commit('PUSH_CACHE_ORDER')
    this.dispatch('terminal/changeInitOrder') // 初始化现有订单
  },
  pullCacheOrder({ commit }) { // 取出订单
    commit('PULL_CACHE_ORDER')
    const terminal = store.state.settings.terminal
    OrderNo(terminal).then(order_no => {
      commit('SET_ORDER_KEY', { key: 'orderNo', value: order_no })
    })
  },
  changeCurrentGoods({ commit }, goods) { // 设置商品列表选中商品
    commit('SET_CURRENT_GOODS', goods)
  },
  changeOrderInfo({ commit }) {
    const createdAt = { // 获取当天订单
      [Op.lt]: new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1),
      [Op.gt]: new Date(new Date(new Date().toLocaleDateString()).getTime())
    }
    const userId = store.state.user.username
    Order.count({
      where: {
        userId: userId,
        createdAt: createdAt
      }
    }).then(response => {
      commit('SET_ORDER_INFO', { key: 'count', value: response || 0 })
    })
    Order.count({
      where: {
        type: 0,
        userId: userId,
        createdAt: createdAt
      }
    }).then(response => {
      commit('SET_ORDER_INFO', { key: 'returns', value: response || 0 })
    })
    Order.sum('total', {
      where: {
        userId: userId,
        createdAt: createdAt
      }
    }).then(response => {
      commit('SET_ORDER_INFO', { key: 'total', value: response || 0 })
    })
    Order.count({
      where: {
        publish: 0
      }
    }).then(response => {
      commit('SET_ORDER_INFO', { key: 'publish', value: response || 0 })
    })
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
