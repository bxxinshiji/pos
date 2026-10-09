/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const Vue = require('vue')
const Vuex = require('vuex')

const root = path.resolve(__dirname, '../..')
Vue.use(Vuex)

// 隔离加载真实源码，动态导入也只能取得明确注入的假依赖。
function loadModule(relativePath, dependencies, context) {
  const filename = path.join(root, relativePath)
  let source = fs.readFileSync(filename, 'utf8')
  if (relativePath.endsWith('.vue')) source = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  const names = []
  source = source.replace(/^import (.+?) from (['"])(.*?)\2[^\n]*$/gm, (line, binding, quote, name) => {
    return 'const ' + binding.replace(/\bas\b/g, ':') + ' = require(' + JSON.stringify(name) + ')'
  }).replace(/\bimport\((['"])(.*?)\1\)/g, (line, quote, name) => {
    return 'Promise.resolve(require(' + JSON.stringify(name) + '))'
  }).replace(/^export function (\w+)/gm, (line, name) => {
    names.push(name)
    return 'function ' + name
  }).replace(/^export default /gm, 'module.exports.default = ')
  names.forEach(name => {
    source += '\nmodule.exports.' + name + ' = ' + name
  })
  const module = { exports: {}}
  const run = vm.runInContext('(function(module, require) {\n' + source + '\n})', context, { filename })
  run(module, name => {
    assert(Object.prototype.hasOwnProperty.call(dependencies, name), '禁止加载未隔离的依赖: ' + name)
    return dependencies[name]
  })
  return module.exports
}

// 使用真实 Mousetrap 处理 F2 和 Escape，只手动运行收银快捷键的零延迟回调。
function createKeyboard() {
  const listeners = new Map()
  const callbacks = []
  const document = {
    addEventListener(type, listener) {
      const items = listeners.get(type) || []
      items.push(listener)
      listeners.set(type, items)
    },
    removeEventListener(type, listener) {
      listeners.set(type, (listeners.get(type) || []).filter(item => item !== listener))
    }
  }
  const input = { tagName: 'INPUT', className: '', parentNode: document }
  const context = vm.createContext({
    document,
    window: {},
    navigator: { platform: 'Win32' },
    module: { exports: {}},
    setTimeout(callback, delay) {
      if (delay === 0) callbacks.push(callback)
      return callbacks.length
    },
    clearTimeout() {},
    setInterval() {
      return 1
    },
    clearInterval() {}
  })
  const mousetrapFile = path.join(root, 'node_modules/mousetrap/mousetrap.js')
  vm.runInContext(fs.readFileSync(mousetrapFile, 'utf8'), context, { filename: mousetrapFile })
  context.Mousetrap = context.module.exports
  const globalBindFile = path.join(root, 'src/renderer/utils/mousetrap-global-bind.js')
  vm.runInContext(fs.readFileSync(globalBindFile, 'utf8'), context, { filename: globalBindFile })
  const shortcuts = loadModule('src/renderer/utils/keyboardShortcuts.js', {
    mousetrap: context.Mousetrap,
    './mousetrap-global-bind': {}
  }, context)
  return {
    context,
    shortcuts,
    keydown(key) {
      const keyCode = key === 'F2' ? 113 : 27
      const event = {
        type: 'keydown',
        key,
        keyCode,
        which: keyCode,
        target: input,
        srcElement: input,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        preventDefault() {},
        stopPropagation() {}
      }
      const items = (listeners.get('keydown') || []).slice()
      items.forEach(listener => listener(event))
      if (document.onkeydown) document.onkeydown(event)
    },
    runCallbacks() {
      while (callbacks.length) callbacks.shift()()
    }
  }
}

function sale(orderNo = 'offline-sale', goods = [{ name: '离线商品', number: 2, total: 400 }]) {
  return {
    userId: 'offline-user',
    terminal: '001',
    orderNo,
    goods,
    pays: [{ type: 'cashPay', amount: 100, getAmount: 100 }],
    type: true,
    number: goods.length ? 2 : 0,
    total: goods.length ? 400 : 0,
    getAmount: goods.length ? 100 : 0,
    waitPay: goods.length ? 300 : 0,
    status: false,
    publish: false
  }
}

// 使用真实 Vuex 执行原挂单和取单流程，仅将订单号查询替换为成功的假返回。
function createCashier(options = {}) {
  const keyboard = createKeyboard()
  const calls = { actions: [], alerts: [], messages: [], orderNumbers: [], payments: [] }
  const storeFacade = {
    get state() {
      return store.state
    },
    dispatch(type, payload) {
      return store.dispatch(type, payload)
    }
  }
  const terminal = loadModule('src/renderer/store/modules/terminal.js', {
    '@/store': storeFacade,
    '@/router': {},
    'element-ui': { Message: message => calls.messages.push(message), MessageBox: {}},
    '@/utils/keyboardShortcuts': keyboard.shortcuts,
    '@/model/api/order': {},
    '@/api/order': {
      OrderNo(terminal, type) {
        calls.orderNumbers.push({ terminal, type })
        return Promise.resolve('offline-next-' + calls.orderNumbers.length)
      }
    },
    '@/model/pay': { models: { pay: {}}}
  }, keyboard.context).default
  terminal.state.cacheOrder = options.cacheOrder || []
  const store = new Vuex.Store({
    state: {
      user: { username: 'offline-user' },
      settings: {
        terminal: '001',
        Keyboard: { pushPullOrder: 'F2' },
        payKeyboard: { scanPay: 'F2' }
      }
    },
    modules: { terminal }
  })
  store.subscribeAction(action => calls.actions.push(action.type))
  const order = sale()
  if (Object.prototype.hasOwnProperty.call(options, 'orderNo')) order.orderNo = options.orderNo
  if (options.empty) Object.assign(order, sale(order.orderNo, []))
  store.commit('terminal/SET_ORDER', order)
  store.commit('terminal/SET_CURRENT_GOODS', order.goods[0] || {})
  const hander = loadModule('src/renderer/views/terminal/cashier/hander/hander.js', {
    '@/store': storeFacade,
    '@/utils/escpos': {},
    'element-ui': { Message: message => calls.messages.push(message) }
  }, keyboard.context).default
  const mousetrap = loadModule('src/renderer/views/terminal/cashier/hander/mousetrap.js', {
    '@/utils/keyboardShortcuts': keyboard.shortcuts,
    'element-ui': { Message: message => calls.messages.push(message) },
    '@/store': storeFacade,
    './hander': hander,
    '@/utils/log': { h() {} }
  }, keyboard.context).default
  const cashier = {
    get order() {
      return store.state.terminal.order
    },
    initOrder() {
      return store.dispatch('terminal/changeInitOrder')
    },
    $alert(message, title, alertOptions) {
      calls.alerts.push({ message, title, options: alertOptions })
      return options.rejectAlert ? Promise.reject(new Error('关闭挂单提示')) : Promise.resolve()
    }
  }
  mousetrap.registerMousetrap.call(cashier)
  return {
    keyboard,
    store,
    order,
    cashier,
    calls,
    click() {
      hander.pushPullOrder(cashier)
    },
    destroy() {
      mousetrap.unregisterMousetrap.call(cashier)
    }
  }
}

// 加载真实支付页的快捷键和退出生命周期，支付渠道及业务初始化均由假对象接收。
function openPayment(harness) {
  class FakePay {
    constructor() {
      this.cancelCalls = 0
      this.listeners = []
    }

    On(name, callback) {
      this.listeners.push({ name, callback })
    }

    Cancel() {
      this.cancelCalls++
    }
  }
  const component = loadModule('src/renderer/views/terminal/cashier/components/pay.vue', {
    '@/utils/keyboardShortcuts': harness.keyboard.shortcuts,
    events: require('events'),
    vuex: { mapState: () => ({}) },
    '@/utils/log': { h() {} },
    './pay': {
      handerPay(key) {
        harness.calls.payments.push(key)
      },
      EventOn() {}
    },
    '@/utils/onkeydown': loadModule('src/renderer/utils/onkeydown.js', {}, harness.keyboard.context).default,
    '@/utils': { useTime: () => 0 },
    '@/utils/pay/index': FakePay
  }, harness.keyboard.context).default
  const page = Object.assign(component.data(), { $store: harness.store })
  Object.defineProperty(page, 'order', { get: () => harness.store.state.terminal.order })
  Object.keys(component.methods).forEach(name => {
    page[name] = component.methods[name].bind(page)
  })
  harness.store.dispatch('terminal/changeIsPay', true)
  component.mounted.call(page)
  return {
    page,
    destroy() {
      component.beforeDestroy.call(page)
    }
  }
}

async function flush() {
  await new Promise(resolve => setImmediate(resolve))
}

function assertEmptyCart(state) {
  assert.strictEqual(state.order.goods.length, 0)
  assert.strictEqual(state.order.pays.length, 0)
  assert.strictEqual(state.order.number, 0)
  assert.strictEqual(state.order.total, 0)
  assert.strictEqual(state.order.getAmount, 0)
  assert.strictEqual(state.order.waitPay, 0)
  assert.strictEqual(Object.keys(state.currentGoods).length, 0)
}

describe('挂单单号检查离线回归', () => {
  const invalidNumbers = [
    { name: '空字符串', value: '' },
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
    { name: '空白字符', value: ' \t\r\n ' }
  ]
  invalidNumbers.forEach(item => {
    it(item.name + '单号有商品时弹窗且不改购物车或挂单数组', async() => {
      const cached = sale('already-cached')
      const harness = createCashier({ orderNo: item.value, cacheOrder: [cached] })
      const state = harness.store.state.terminal
      const cacheOrder = state.cacheOrder
      const selected = state.currentGoods
      const snapshot = JSON.stringify(harness.order)
      harness.click()
      await flush()
      assert.strictEqual(harness.calls.alerts.length, 1)
      const alert = harness.calls.alerts[0]
      assert.strictEqual(alert.message, '当前订单没有单号，请等待单号生成后再挂单。')
      assert.strictEqual(alert.title, '无法挂单')
      assert.strictEqual(alert.options.type, 'error')
      assert.strictEqual(alert.options.confirmButtonText, '确定')
      assert.strictEqual(state.order, harness.order)
      assert.strictEqual(JSON.stringify(state.order), snapshot)
      assert.strictEqual(state.currentGoods, selected)
      assert.strictEqual(state.cacheOrder, cacheOrder)
      assert.strictEqual(state.cacheOrder.length, 1)
      assert.strictEqual(state.cacheOrder[0], cached)
      assert.deepStrictEqual(harness.calls.actions, [])
      assert.deepStrictEqual(harness.calls.orderNumbers, [])
      harness.destroy()
    })
  })

  it('有单号沿用真实 Vuex 挂单流程，缓存原商品和付款并清空购物车', async() => {
    const harness = createCashier()
    const goods = harness.order.goods
    const pays = harness.order.pays
    harness.click()
    await flush()
    const state = harness.store.state.terminal
    assert.strictEqual(harness.calls.alerts.length, 0)
    assert(harness.calls.actions.includes('terminal/pushCacheOrder'))
    assert(harness.calls.actions.includes('terminal/changeInitOrder'))
    assert.strictEqual(state.cacheOrder.length, 1)
    assert.strictEqual(state.cacheOrder[0], harness.order)
    assert.strictEqual(state.cacheOrder[0].goods, goods)
    assert.strictEqual(state.cacheOrder[0].pays, pays)
    assert.strictEqual(state.cacheOrder[0].total, 400)
    assert.strictEqual(state.order.orderNo, 'offline-next-1')
    assertEmptyCart(state)
    harness.destroy()
  })

  it('购物车为空且已有挂单时沿用原取单流程', async() => {
    const cached = sale('already-cached')
    const harness = createCashier({ empty: true, orderNo: '', cacheOrder: [cached] })
    harness.click()
    await flush()
    const state = harness.store.state.terminal
    assert.strictEqual(harness.calls.alerts.length, 0)
    assert(harness.calls.actions.includes('terminal/pullCacheOrder'))
    assert.strictEqual(state.cacheOrder.length, 0)
    assert.strictEqual(state.order, cached)
    assert.strictEqual(state.order.goods.length, 1)
    assert.strictEqual(state.order.pays.length, 1)
    assert.strictEqual(state.order.orderNo, 'offline-next-1')
    harness.destroy()
  })

  it('购物车和挂单均为空时保留原警告', () => {
    const harness = createCashier({ empty: true, orderNo: '' })
    harness.click()
    assert.strictEqual(harness.calls.alerts.length, 0)
    assert.strictEqual(harness.calls.messages.length, 1)
    assert.strictEqual(harness.calls.messages[0].type, 'warning')
    assert.strictEqual(harness.calls.messages[0].message, '订单为空无法挂起。')
    assert.deepStrictEqual(harness.calls.actions, [])
    assert.strictEqual(harness.store.state.terminal.order, harness.order)
    assert.strictEqual(harness.store.state.terminal.cacheOrder.length, 0)
    harness.destroy()
  })

  it('支付 F2 接管后 Esc 退出，恢复的真实 F2 挂单显示无单号弹窗', async() => {
    const harness = createCashier({ orderNo: '' })
    const payment = openPayment(harness)
    harness.keyboard.keydown('F2')
    harness.keyboard.runCallbacks()
    assert.deepStrictEqual(harness.calls.payments, ['scanPay'])
    assert.strictEqual(harness.calls.alerts.length, 0)
    harness.keyboard.keydown('Escape')
    assert.strictEqual(payment.page.model.cancelCalls, 1)
    payment.page.model.listeners.find(item => item.name === 'cancel').callback(true)
    payment.destroy()
    assert.strictEqual(harness.store.state.terminal.isPay, false)
    harness.keyboard.keydown('F2')
    harness.keyboard.runCallbacks()
    await flush()
    assert.strictEqual(harness.calls.alerts.length, 1)
    assert.strictEqual(harness.calls.alerts[0].title, '无法挂单')
    assert.strictEqual(harness.store.state.terminal.order, harness.order)
    assert.strictEqual(harness.store.state.terminal.cacheOrder.length, 0)
    assert(!harness.calls.actions.includes('terminal/pushCacheOrder'))
    assert.deepStrictEqual(harness.calls.orderNumbers, [])
    harness.destroy()
  })

  it('关闭无单号弹窗产生的拒绝被处理，不形成未处理拒绝', async() => {
    const unhandled = []
    const listener = error => unhandled.push(error)
    process.on('unhandledRejection', listener)
    const harness = createCashier({ orderNo: '', rejectAlert: true })
    try {
      harness.click()
      await flush()
      assert.strictEqual(harness.calls.alerts.length, 1)
      assert.deepStrictEqual(unhandled, [])
      assert.deepStrictEqual(harness.calls.actions, [])
      assert.strictEqual(harness.store.state.terminal.order, harness.order)
    } finally {
      process.removeListener('unhandledRejection', listener)
      harness.destroy()
    }
  })

  it('补填单号后可以再次挂单，不留下阻止重试的状态', async() => {
    const harness = createCashier({ orderNo: '' })
    harness.click()
    assert.strictEqual(harness.calls.alerts.length, 1)
    harness.order.orderNo = 'filled-order-no'
    harness.click()
    await flush()
    const state = harness.store.state.terminal
    assert.strictEqual(harness.calls.alerts.length, 1)
    assert.strictEqual(state.cacheOrder.length, 1)
    assert.strictEqual(state.cacheOrder[0], harness.order)
    assert.strictEqual(state.cacheOrder[0].orderNo, 'filled-order-no')
    assertEmptyCart(state)
    harness.destroy()
  })
})
