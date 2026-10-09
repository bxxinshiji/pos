/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '../..')

// 在隔离浏览器中加载源码，只允许测试明确注入的依赖。
function loadModule(relativePath, dependencies, context) {
  const filename = path.join(root, relativePath)
  let source = fs.readFileSync(filename, 'utf8')
  if (relativePath.endsWith('.vue')) source = source.match(/<script>([\s\S]*?)<\/script>/)[1]
  const names = []
  source = source.replace(/^import (.+?) from (['"])(.*?)\2[^\n]*$/gm, (line, binding, quote, name) => {
    return 'const ' + binding.replace(/\bas\b/g, ':') + ' = require(' + JSON.stringify(name) + ')'
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

// 使用本地真实 Mousetrap 和全局绑定扩展，模拟 document 的键盘事件。
function createBrowser() {
  const listeners = new Map()
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
  const body = { tagName: 'BODY', className: '', parentNode: document }
  const input = { tagName: 'INPUT', className: '', parentNode: body }
  document.body = body
  const context = vm.createContext({
    document,
    window: {},
    navigator: { platform: 'Win32' },
    module: { exports: {}},
    setTimeout() {
      return 1
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

  let timeStamp = 0
  function dispatchKeyboard(type, key, options = {}) {
    const target = input
    const codes = { Enter: 13, Escape: 27, Home: 36 }
    const keyCode = /^F\d+$/.test(key) ? 111 + Number(key.slice(1)) : codes[key] || key.charCodeAt(0)
    const event = {
      type,
      key,
      repeat: Boolean(options.repeat),
      keyCode,
      which: keyCode,
      target,
      srcElement: target,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      timeStamp: ++timeStamp,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
      stopPropagation() {
        this.cancelBubble = true
      }
    }
    // 同一 document 的监听仍按注册顺序收到事件，随后运行扫码监听。
    const items = (listeners.get(type) || []).slice()
    items.forEach(listener => listener(event))
    const listener = document['on' + type]
    if (listener) listener(event)
    return event
  }

  return {
    context,
    document,
    shortcuts,
    keydown(key, options) {
      return dispatchKeyboard('keydown', key, options)
    },
    keyup(key) {
      return dispatchKeyboard('keyup', key)
    }
  }
}

// 只保留支付组件的快捷键和生命周期方法，业务、日志及状态均由假对象接收。
function createPayPage(browser, payKeyboard = { scanPay: 'F2' }) {
  const calls = { pays: [], scans: [], cards: [], messages: [], dispatches: [], eventOn: 0 }
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
    '@/utils/keyboardShortcuts': browser.shortcuts,
    events: require('events'),
    vuex: { mapState: () => ({}) },
    '@/utils/log': { h() {} },
    './pay': {
      handerPay(key) {
        calls.pays.push(key)
      },
      scanPay(code) {
        calls.scans.push(code)
      },
      cardPay(code) {
        calls.cards.push(code)
      },
      EventOn() {
        calls.eventOn++
      }
    },
    '@/utils/onkeydown': loadModule('src/renderer/utils/onkeydown.js', {}, browser.context).default,
    '@/utils': { useTime: () => 0 },
    '@/utils/pay/index': FakePay
  }, browser.context).default
  const page = Object.assign(component.data(), {
    order: { waitPay: 100 },
    $store: {
      state: { settings: { payKeyboard }},
      dispatch(name, value) {
        calls.dispatches.push({ name, value })
      }
    },
    $message(message) {
      calls.messages.push(message)
    }
  })
  Object.keys(component.methods).forEach(name => {
    page[name] = component.methods[name].bind(page)
  })
  return {
    page,
    calls,
    mount() {
      component.mounted.call(page)
    },
    destroy() {
      component.beforeDestroy.call(page)
    }
  }
}

// 加载真实收银页面的按下和扫码松键监听，订单初始化及输入处理只记录调用。
function createCashierPage(browser) {
  const calls = { inputs: [], focus: 0, init: 0, dispatches: [] }
  const component = loadModule('src/renderer/views/terminal/cashier/index.vue', {
    './hander/hander': {},
    './hander/mousetrap': {},
    './hander/goods': {},
    vuex: { mapState: () => ({}), mapGetters: () => ({}) },
    './components/heads.vue': {},
    './components/item.vue': {},
    './components/foots.vue': {},
    './components/fixed.vue': {},
    './components/pay.vue': {},
    './components/inputPrice.vue': {},
    '@/utils/onkeydown': loadModule('src/renderer/utils/onkeydown.js', {}, browser.context).default,
    '@/utils/keyboardShortcuts': browser.shortcuts,
    '@/api/vip_card': {},
    '@/utils/log': { h() {} }
  }, browser.context).default
  const page = Object.assign(component.data(), {
    loadOrder: {},
    order: {},
    $refs: { foots: { input: '123456' }},
    $store: {
      dispatch(name, value) {
        calls.dispatches.push({ name, value })
      }
    },
    initOrder() {
      calls.init++
    },
    focus() {
      calls.focus++
    },
    handerInput(input, isPlucode) {
      calls.inputs.push({ input, isPlucode })
    },
    unregisterMousetrap() {}
  })
  page.keydown = component.methods.keydown.bind(page)
  return {
    page,
    calls,
    mount() {
      component.mounted.call(page)
    },
    destroy() {
      component.destroyed.call(page)
    }
  }
}

// 捕获真实 App 的 Home IPC 回调，启动同步和清理任务全部替换为无副作用方法。
function createApp(browser, payKeyboard) {
  const callbacks = new Map()
  const calls = { routes: [], messages: [], dispatches: [], init: 0, sync: 0 }
  const component = loadModule('src/renderer/App.vue', {
    sequelize: { Op: {}},
    electron: {
      ipcRenderer: {
        on(name, callback) {
          callbacks.set(name, callback)
        }
      }
    },
    '@/api/terminal': {},
    '@/api/payBcbt': {},
    '@/api/order': {},
    '@/sql2000/api/config': {},
    '@/model/api/order': {},
    '@/model/api/payOrder': {},
    '@/model/api/orderPD': {},
    '@/utils/log': { h() {} },
    '@/utils/keyboardShortcuts': browser.shortcuts
  }, browser.context).default
  const app = {
    $store: {
      state: { terminal: { isPay: true }, settings: { payKeyboard }},
      dispatch(name, value) {
        calls.dispatches.push({ name, value })
        if (name === 'terminal/changeIsPay') this.state.terminal.isPay = value
      }
    },
    $message(message) {
      calls.messages.push(message)
    },
    $router: {
      push(route) {
        calls.routes.push(route.path)
      }
    },
    init() {
      calls.init++
    },
    syncTerminal() {
      calls.sync++
    }
  }
  component.mounted.call(app)
  assert.strictEqual(calls.init, 1)
  assert.strictEqual(calls.sync, 1)
  return {
    app,
    calls,
    home() {
      callbacks.get('main-process-home')({}, null)
    }
  }
}

describe('快捷键所有者与支付优先级离线回归', () => {
  it('F2 从全局到收银再到支付接管，释放后逐层恢复且输入框内可用', () => {
    const browser = createBrowser()
    const globalOwner = {}
    const cashier = {}
    const payment = {}
    const calls = []
    const { registerShortcuts, unregisterShortcuts } = browser.shortcuts
    registerShortcuts(globalOwner, { F2: () => calls.push('全局') })
    browser.keydown('F2')
    registerShortcuts(cashier, { f2: () => calls.push('收银') })
    browser.keydown('F2')
    registerShortcuts(payment, { F2: () => calls.push('支付') }, 1)
    browser.keydown('F2')
    unregisterShortcuts(payment)
    browser.keydown('F2')
    unregisterShortcuts(cashier)
    browser.keydown('F2')
    unregisterShortcuts(globalOwner)
    browser.keydown('F2')
    assert.deepStrictEqual(calls, ['全局', '收银', '支付', '收银', '全局'])
  })

  it('支付覆盖关机键时只支付，释放恢复关机且不影响其他按键', () => {
    const browser = createBrowser()
    const system = {}
    const payment = {}
    const calls = []
    browser.shortcuts.registerShortcuts(system, {
      F1: () => calls.push('关机'),
      F3: () => calls.push('其他')
    })
    browser.shortcuts.registerShortcuts(payment, { F1: () => calls.push('支付') }, 1)
    browser.keydown('F1')
    browser.keydown('F3')
    browser.shortcuts.unregisterShortcuts(payment)
    browser.keydown('F1')
    assert.deepStrictEqual(calls, ['支付', '其他', '关机'])
  })

  it('重复释放不会误删已恢复的收银 F2', () => {
    const browser = createBrowser()
    const cashier = {}
    const payment = {}
    const calls = []
    browser.shortcuts.registerShortcuts(cashier, { F2: () => calls.push('收银') })
    browser.shortcuts.registerShortcuts(payment, { F2: () => calls.push('支付') }, 1)
    browser.shortcuts.unregisterShortcuts(payment)
    browser.shortcuts.unregisterShortcuts(payment)
    browser.keydown('F2')
    assert.deepStrictEqual(calls, ['收银'])
  })

  it('反复开关支付页不积累回调', () => {
    const browser = createBrowser()
    const calls = []
    browser.shortcuts.registerShortcuts({}, { F2: () => calls.push('收银') })
    for (let index = 0; index < 3; index++) {
      const payment = {}
      browser.shortcuts.registerShortcuts(payment, { F2: () => calls.push('支付' + index) }, 1)
      browser.keydown('F2')
      browser.shortcuts.unregisterShortcuts(payment)
      browser.keydown('F2')
    }
    assert.deepStrictEqual(calls, ['支付0', '收银', '支付1', '收银', '支付2', '收银'])
  })

  it('新支付实例优先，旧实例双释放不删除新实例', () => {
    const browser = createBrowser()
    const oldPayment = {}
    const newPayment = {}
    const calls = []
    browser.shortcuts.registerShortcuts({}, { F2: () => calls.push('收银') })
    browser.shortcuts.registerShortcuts(oldPayment, { F2: () => calls.push('旧支付') }, 1)
    browser.shortcuts.registerShortcuts(newPayment, { F2: () => calls.push('新支付') }, 1)
    browser.shortcuts.unregisterShortcuts(oldPayment)
    browser.shortcuts.unregisterShortcuts(oldPayment)
    browser.keydown('F2')
    browser.shortcuts.unregisterShortcuts(newPayment)
    browser.keydown('F2')
    assert.deepStrictEqual(calls, ['新支付', '收银'])
  })

  it('底层收银页先销毁后不会复活，只恢复仍存活的全局键', () => {
    const browser = createBrowser()
    const cashier = {}
    const payment = {}
    const calls = []
    browser.shortcuts.registerShortcuts({}, { F2: () => calls.push('全局') })
    browser.shortcuts.registerShortcuts(cashier, { F2: () => calls.push('已销毁收银') })
    browser.shortcuts.registerShortcuts(payment, { F2: () => calls.push('支付') }, 1)
    browser.shortcuts.unregisterShortcuts(cashier)
    browser.keydown('F2')
    browser.shortcuts.unregisterShortcuts(payment)
    browser.keydown('F2')
    assert.deepStrictEqual(calls, ['支付', '全局'])
  })

  it('同一所有者更换设置会释放旧键，空键及空配置不会留下绑定', () => {
    const browser = createBrowser()
    const owner = {}
    const calls = []
    browser.shortcuts.registerShortcuts({}, { F2: () => calls.push('全局') })
    browser.shortcuts.registerShortcuts(owner, { F2: () => calls.push('旧设置') })
    browser.shortcuts.registerShortcuts(owner, {
      F3: () => calls.push('新设置'),
      '': () => calls.push('空键'),
      '   ': () => calls.push('空白键')
    })
    browser.keydown('F2')
    browser.keydown('F3')
    browser.shortcuts.registerShortcuts(owner, {})
    browser.keydown('F3')
    assert.deepStrictEqual(calls, ['全局', '新设置'])
  })

  it('支付回调即使只提示锁定也消费事件，不穿透到低优先级', () => {
    const browser = createBrowser()
    const calls = []
    browser.shortcuts.registerShortcuts({}, { F2: () => calls.push('收银') })
    browser.shortcuts.registerShortcuts({}, {
      F2: () => {
        calls.push('锁定提示')
      }
    }, 1)
    const event = browser.keydown('F2')
    assert.deepStrictEqual(calls, ['锁定提示'])
    assert.strictEqual(event.defaultPrevented, true)
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(event), true)
  })

  it('Home 仅由 IPC 分发支付，DOM 不触发且支付释放后返回 false', () => {
    const browser = createBrowser()
    const payment = {}
    const calls = []
    browser.shortcuts.registerShortcuts({}, { Home: () => calls.push('普通 Home') })
    browser.shortcuts.registerShortcuts(payment, { Home: () => calls.push('支付') }, 1)
    browser.keydown('Home')
    assert.deepStrictEqual(calls, [])
    assert.strictEqual(browser.shortcuts.triggerPaymentShortcut('Home'), true)
    assert.deepStrictEqual(calls, ['支付'])
    browser.shortcuts.unregisterShortcuts(payment)
    assert.strictEqual(browser.shortcuts.triggerPaymentShortcut('Home'), false)
    assert.deepStrictEqual(calls, ['支付'])
  })

  it('Enter 和 Escape 别名通过真实 DOM 标记消费，普通事件没有支付标记', () => {
    const browser = createBrowser()
    const calls = []
    browser.shortcuts.registerShortcuts({}, {
      Enter: () => calls.push('确认'),
      Escape: () => calls.push('取消')
    }, 1)
    const enter = browser.keydown('Enter')
    const escape = browser.keydown('Escape')
    const other = browser.keydown('F3')
    assert.deepStrictEqual(calls, ['确认', '取消'])
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(enter), true)
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(escape), true)
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(other), false)
    assert.strictEqual(enter.defaultPrevented, true)
    assert.strictEqual(escape.defaultPrevented, true)
  })
})

describe('真实支付组件快捷键生命周期离线回归', () => {
  it('默认 Escape 正常取消并按回调关闭，F2 恢复且重复销毁不误删', () => {
    const browser = createBrowser()
    const payment = createPayPage(browser)
    const calls = []
    browser.shortcuts.registerShortcuts({}, { F2: () => calls.push('收银') })
    payment.mount()
    browser.keydown('Escape')
    assert.strictEqual(payment.page.model.cancelCalls, 1)
    const cancelListener = payment.page.model.listeners.find(item => item.name === 'cancel')
    assert(cancelListener)
    cancelListener.callback(true)
    assert.deepStrictEqual(payment.calls.dispatches, [{ name: 'terminal/changeIsPay', value: false }])
    browser.keydown('F2')
    payment.destroy()
    payment.destroy()
    browser.keydown('F2')
    assert.deepStrictEqual(payment.calls.pays, [])
    assert.deepStrictEqual(calls, ['收银', '收银'])
    assert.strictEqual(browser.document.onkeydown, undefined)
  })

  it('注册读取当前设置，更换及清空设置后不保留旧支付键', () => {
    const browser = createBrowser()
    const payment = createPayPage(browser)
    const calls = []
    browser.shortcuts.registerShortcuts({}, { F2: () => calls.push('收银') })
    payment.page.registerMousetrap()
    browser.keydown('F2')
    payment.page.$store.state.settings.payKeyboard = { scanPay: 'F3', cardPay: '', cashPay: null }
    payment.page.registerMousetrap()
    browser.keydown('F2')
    browser.keydown('F3')
    payment.page.$store.state.settings.payKeyboard = {}
    payment.page.registerMousetrap()
    browser.keydown('F3')
    assert.deepStrictEqual(payment.calls.pays, ['scanPay', 'scanPay'])
    assert.deepStrictEqual(calls, ['收银'])
  })

  it('支付锁定时只显示现有提示，收银及关机回调都不执行', () => {
    const browser = createBrowser()
    const payment = createPayPage(browser, { scanPay: 'F2', cashPay: 'F1' })
    const lowerCalls = []
    browser.shortcuts.registerShortcuts({}, {
      F2: () => lowerCalls.push('收银'),
      F1: () => lowerCalls.push('关机')
    })
    payment.page.lock = true
    payment.mount()
    browser.keydown('F2')
    browser.keydown('F1')
    assert.deepStrictEqual(payment.calls.pays, [])
    assert.deepStrictEqual(lowerCalls, [])
    assert.strictEqual(payment.calls.messages.length, 2)
    assert.strictEqual(payment.calls.messages[0].message, '已锁定正在支付中请稍等...')
    payment.destroy()
  })

  it('Enter 被支付键消费后同一事件不再进入扫码流程', () => {
    const browser = createBrowser()
    const payment = createPayPage(browser, { scanPay: 'Enter' })
    payment.mount()
    browser.keydown('1')
    const event = browser.keydown('Enter')
    assert.deepStrictEqual(payment.calls.pays, ['scanPay'])
    assert.deepStrictEqual(payment.calls.scans, [])
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(event), true)
    assert.strictEqual(payment.page.lock, false)
    payment.destroy()
  })

  it('Escape 被支付键消费后同一事件不再取消支付', () => {
    const browser = createBrowser()
    const payment = createPayPage(browser, { cashPay: 'Escape' })
    payment.mount()
    const event = browser.keydown('Escape')
    assert.deepStrictEqual(payment.calls.pays, ['cashPay'])
    assert.strictEqual(payment.page.model.cancelCalls, 0)
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(event), true)
    payment.destroy()
  })

  it('旧页关闭及销毁双释放后，新页快捷键和扫码监听仍在', () => {
    const browser = createBrowser()
    const oldPayment = createPayPage(browser)
    const newPayment = createPayPage(browser)
    oldPayment.mount()
    oldPayment.page.handleClose()
    newPayment.mount()
    const scanner = browser.document.onkeydown
    oldPayment.destroy()
    oldPayment.page.unregisterMousetrap()
    assert.strictEqual(browser.document.onkeydown, scanner)
    browser.keydown('F2')
    browser.keydown('1')
    browser.keydown('2')
    browser.keydown('Enter')
    assert.deepStrictEqual(oldPayment.calls.pays, [])
    assert.deepStrictEqual(oldPayment.calls.scans, [])
    assert.deepStrictEqual(newPayment.calls.pays, ['scanPay'])
    assert.deepStrictEqual(newPayment.calls.scans, ['12'])
    newPayment.destroy()
    assert.strictEqual(browser.document.onkeydown, undefined)
  })

  it('旧页仍打开时新页接管，旧页销毁不清新页扫描器', () => {
    const browser = createBrowser()
    const oldPayment = createPayPage(browser)
    const newPayment = createPayPage(browser)
    oldPayment.mount()
    newPayment.mount()
    const scanner = browser.document.onkeydown
    oldPayment.destroy()
    oldPayment.destroy()
    assert.strictEqual(browser.document.onkeydown, scanner)
    browser.keydown('F2')
    browser.keydown('3')
    browser.keydown('Enter')
    assert.deepStrictEqual(oldPayment.calls.pays, [])
    assert.deepStrictEqual(newPayment.calls.pays, ['scanPay'])
    assert.deepStrictEqual(newPayment.calls.scans, ['3'])
    newPayment.destroy()
  })
})

describe('真实收银页与支付页键盘事件联动离线回归', () => {
  it('支付 Enter 松键不会输入商品，释放后下一次普通 Enter 恢复输入', () => {
    const browser = createBrowser()
    const cashier = createCashierPage(browser)
    const payment = createPayPage(browser, { cashPay: 'Enter' })
    cashier.mount()
    payment.mount()
    browser.keydown('Enter')
    assert.strictEqual(cashier.page._skipScannerEnter, true)
    browser.keyup('Enter')
    assert.deepStrictEqual(payment.calls.pays, ['cashPay'])
    assert.deepStrictEqual(cashier.calls.inputs, [])
    assert.strictEqual(cashier.page._skipScannerEnter, false)
    payment.destroy()
    browser.keydown('Enter')
    browser.keyup('Enter')
    assert.deepStrictEqual(cashier.calls.inputs, [{ input: '123456', isPlucode: false }])
    cashier.destroy()
  })

  it('支付 Enter 同步释放并关闭后，本次松键仍跳过商品输入', () => {
    const browser = createBrowser()
    const cashier = createCashierPage(browser)
    const payment = createPayPage(browser, { cashPay: 'Enter' })
    payment.page.handerPay = key => {
      payment.calls.pays.push(key)
      payment.page.handleClose()
    }
    cashier.mount()
    payment.mount()
    const event = browser.keydown('Enter')
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(event), true)
    assert.strictEqual(cashier.page._skipScannerEnter, true)
    browser.keyup('Enter')
    assert.deepStrictEqual(payment.calls.pays, ['cashPay'])
    assert.deepStrictEqual(payment.calls.dispatches, [{ name: 'terminal/changeIsPay', value: false }])
    assert.deepStrictEqual(cashier.calls.inputs, [])
    assert.deepStrictEqual(payment.calls.scans, [])
    browser.keydown('Enter')
    browser.keyup('Enter')
    assert.deepStrictEqual(cashier.calls.inputs, [{ input: '123456', isPlucode: false }])
    payment.destroy()
    cashier.destroy()
  })

  it('支付 Enter 同步关闭后的长按重复事件保留标记，下一次新 Enter 恢复输入', () => {
    const browser = createBrowser()
    const cashier = createCashierPage(browser)
    const payment = createPayPage(browser, { cashPay: 'Enter' })
    payment.page.handerPay = key => {
      payment.calls.pays.push(key)
      payment.page.handleClose()
    }
    cashier.mount()
    payment.mount()
    browser.keydown('Enter')
    assert.strictEqual(cashier.page._skipScannerEnter, true)
    const repeat = browser.keydown('Enter', { repeat: true })
    assert.strictEqual(browser.shortcuts.isPaymentShortcutEvent(repeat), false)
    assert.strictEqual(cashier.page._skipScannerEnter, true)
    browser.keyup('Enter')
    assert.deepStrictEqual(cashier.calls.inputs, [])
    assert.strictEqual(cashier.page._skipScannerEnter, false)
    browser.keydown('Enter')
    browser.keyup('Enter')
    assert.deepStrictEqual(payment.calls.pays, ['cashPay'])
    assert.deepStrictEqual(cashier.calls.inputs, [{ input: '123456', isPlucode: false }])
    payment.destroy()
    cashier.destroy()
  })

  it('支付 Escape 同步关闭后同一事件不会再次取消或聚焦收银页', () => {
    const browser = createBrowser()
    const cashier = createCashierPage(browser)
    const payment = createPayPage(browser, { cashPay: 'Escape' })
    payment.page.handerPay = key => {
      payment.calls.pays.push(key)
      payment.page.handleClose()
    }
    cashier.mount()
    payment.mount()
    browser.keydown('Escape')
    assert.deepStrictEqual(payment.calls.pays, ['cashPay'])
    assert.strictEqual(payment.page.model.cancelCalls, 0)
    assert.strictEqual(cashier.calls.focus, 1)
    assert.deepStrictEqual(payment.calls.dispatches, [{ name: 'terminal/changeIsPay', value: false }])
    payment.destroy()
    cashier.destroy()
  })
})

describe('真实 Home IPC 入口离线回归', () => {
  it('Home 支付及锁定提示均不回主页，支付页关闭后恢复导航', () => {
    const browser = createBrowser()
    const app = createApp(browser, { cashPay: 'Home' })
    const payment = createPayPage(browser)
    payment.page.$store = app.app.$store
    payment.mount()
    browser.keydown('Home')
    assert.deepStrictEqual(payment.calls.pays, [])
    app.home()
    assert.deepStrictEqual(payment.calls.pays, ['cashPay'])
    assert.deepStrictEqual(app.calls.routes, [])
    payment.page.lock = true
    app.home()
    assert.deepStrictEqual(payment.calls.pays, ['cashPay'])
    assert.strictEqual(payment.calls.messages.length, 1)
    assert.deepStrictEqual(app.calls.messages, [])
    assert.deepStrictEqual(app.calls.routes, [])
    payment.page.handleClose()
    app.home()
    assert.deepStrictEqual(app.calls.routes, ['/'])
    payment.destroy()
  })

  it('未配置 Home 支付时保留支付锁定提示，释放后恢复普通主页操作', () => {
    const browser = createBrowser()
    const app = createApp(browser, { scanPay: 'F2' })
    const payment = createPayPage(browser)
    payment.page.$store = app.app.$store
    payment.mount()
    app.home()
    assert.deepStrictEqual(payment.calls.pays, [])
    assert.strictEqual(app.calls.messages.length, 1)
    assert.strictEqual(app.calls.messages[0].message, '支付锁定中,请勿进行其他操作!')
    assert.deepStrictEqual(app.calls.routes, [])
    payment.page.handleClose()
    assert.strictEqual(browser.shortcuts.triggerPaymentShortcut('Home'), false)
    app.home()
    assert.deepStrictEqual(app.calls.routes, ['/'])
    payment.destroy()
  })
})
