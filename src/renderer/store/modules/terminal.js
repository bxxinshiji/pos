import store from '@/store'
const OrderModel = import('@/model/api/order')
const Order = import('@/api/order')

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
  cacheOrder: [], //  挂单的缓存订单
  loadOrder: {}, // 加载订单 1、支付成功没有下单成功的订单重新加载 2、离开页面的订单进行缓存
  cacheGoods: {}, // 缓存自定义价格商品信息
  currentGoods: {}, // 商品列表页面选中的商品
  isInputPrice: false, // 自定义输入商品价格页面控制
  isPay: false, // 支付页面悬浮
  payAmount: 0,
  orderInfo: { // 订单汇总信息
    count: 0, // 总数
    returns: 0, // 退款
    total: 0, // 总金额
    publish: 0, // 未上报
    pays: []
  },
  syncTerminal: true // 是否允许同步终端
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
  IS_PAY: (state, visible) => { // 自定义输入商品价格页面控制
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
    state.order.pays.forEach((pay, index) => {
      if (pay.status) { // 支付失败支付状态待支付-自动结算订单问题
        waitPay = waitPay - pay.amount
      }
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
    Order.then(o => {
      o.OrderNo(terminal).then(order_no => {
        commit('SET_ORDER_KEY', { key: 'userId', value: store.state.user.username })
        commit('SET_ORDER_KEY', { key: 'terminal', value: state.settings.terminal })
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
    OrderModel.then(m => {
      m.Info(store.state.user.username).then(info => {
        commit('SET_ORDER_INFO', info)
      })
    })
  },
  handerSyncTerminal({ commit }, value) { // 是否允许同步终端
    commit('SYNC_TERMINAL', value)
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
