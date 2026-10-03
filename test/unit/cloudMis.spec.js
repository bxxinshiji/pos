/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const Vue = require('vue')
const compiler = require('vue-template-compiler')

const root = path.resolve(__dirname, '../..')

// 隔离加载真实业务代码，未声明的依赖禁止访问网络、数据库或 Electron。
function loadModule(relativePath, dependencies) {
  const filename = path.join(root, relativePath)
  const source = fs.readFileSync(filename, 'utf8')
  const compiled = source.replace(/^import (.+?) from (['"])(.*?)\2[^\n]*$/gm, (line, binding, quote, name) => {
    return 'const ' + binding.replace(/\bas\b/g, ':') + ' = require(' + JSON.stringify(name) + ')'
  }).replace(/^export default /gm, 'module.exports.default = ')
  const module = { exports: {} }
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    Promise,
    setTimeout,
    require(name) {
      assert(Object.prototype.hasOwnProperty.call(dependencies, name), '禁止加载未隔离的依赖: ' + name)
      return dependencies[name]
    }
  }, { filename })
  return module.exports
}

const config = loadModule('src/renderer/utils/pay/config.js', {}).default
const Pay = loadModule('src/renderer/utils/pay/index.js', {
  events: require('events'),
  './config.js': config
}).default

// 为异常路径设置短超时，防止漏掉 Promise 结算后测试一直等待。
async function settled(promise) {
  let timer
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('支付 Promise 未完成')), 250)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function rejection(promise) {
  try {
    await settled(promise)
  } catch (error) {
    assert.notStrictEqual(error.message, '支付 Promise 未完成')
    return error
  }
  assert.fail('应返回支付错误')
}

function observe(pay) {
  const events = { responses: [], info: [] }
  pay.On('response', response => events.responses.push(response))
  pay.On('info', (type, message) => events.info.push({ type, message }))
  return events
}

// 保留真实收银入口、支付门面与轮询，只替换外部调用及等待时间。
function createCashier(options = {}) {
  const calls = {
    bookkeep: [],
    query: [],
    aop: [],
    create: [],
    createBookkeep: [],
    localCreate: [],
    responses: [],
    info: [],
    handerOrder: 0
  }
  const queryResponses = (options.queryResponses || [
    { status: 'WAITING' },
    { status: 'SUCCESS', returnCode: 'SUCCESS' }
  ]).slice()
  const success = { data: { content: { status: 'SUCCESS', returnCode: 'SUCCESS' } } }
  const Scan = loadModule('src/renderer/utils/pay/scanBcbt.js', {
    '@/api/payBcbt': {
      AopF2F(order, userId) {
        calls.aop.push({ order, userId })
        return Promise.resolve(success)
      },
      Bookkeep(order, userId) {
        calls.bookkeep.push({ order, userId })
        return Promise.resolve({ data: { content: { status: 'USERPAYING' } } })
      },
      Query(order, userId) {
        calls.query.push({ order, userId })
        assert(queryResponses.length > 0, '出现多余支付查询')
        return Promise.resolve({ data: { content: queryResponses.shift() } })
      },
      GetUserId() {
        return 'department-user'
      },
      IsDepIsdentical(goods) {
        return goods.every(item => item.depCode === goods[0].depCode)
      }
    },
    '@/model/api/payOrder': {
      Create(order) {
        calls.localCreate.push(order)
        if (options.storageError) return Promise.reject(options.storageError)
        return Promise.resolve(Object.assign({}, order, {
          save() {
            return Promise.resolve()
          }
        }))
      }
    },
    '@/utils/pay-bcbt-electron-store': {
      get(key) {
        if (key === 'users') return options.users
        if (key === 'userPayType') return 6
      }
    },
    './config.js': config
  }).default
  Scan.prototype.Sleep = () => Promise.resolve()
  class UnsupportedPool {
    constructor() {
      assert.fail('不应进入其他支付模块')
    }
  }
  const methods = loadModule('src/renderer/views/terminal/cashier/components/pay.js', {
    '@/store': {},
    'element-ui': {},
    '@/api/order': {},
    '@/model/api/payOrder': {},
    '@/api/vip_card': {},
    '@/utils/index': { parseTime: () => '123456789' },
    '@/utils/print': {},
    '@/utils/escpos': {},
    '@/utils/log': { h() {} },
    '@/model/api/order': {},
    '@/utils/pay/config': config,
    '@/utils/pay/scanBcbt': Scan,
    '@/utils/pay/cash': UnsupportedPool,
    '@/utils/pay/card': UnsupportedPool,
    '@/utils/pay/RemoteCard': UnsupportedPool
  }).default
  const model = new Pay()
  const create = model.Create
  model.Create = function(order) {
    calls.create.push(order)
    calls.payment = create.call(this, order)
    return calls.payment
  }
  const createBookkeep = model.CreateBookkeep
  assert.strictEqual(typeof createBookkeep, 'function', '支付门面必须提供云 MIS 入口')
  model.CreateBookkeep = function(order) {
    calls.createBookkeep.push(order)
    calls.payment = createBookkeep.call(this, order)
    return calls.payment
  }
  const responseEvent = model.ResponseEvent
  model.ResponseEvent = function(response) {
    calls.responses.push(response)
    return responseEvent.call(this, response)
  }
  const infoEvent = model.InfoEvent
  model.InfoEvent = function(type, message) {
    calls.info.push({ type, message })
    return infoEvent.call(this, type, message)
  }
  const cashier = Object.assign({}, methods, {
    model,
    lock: false,
    status: 'warning',
    payingInfo: '',
    cloudMisSn: options.sn === undefined ? 'pos-sn-001' : options.sn,
    scanStoreName: '测试商户',
    orderTitle: '离线测试订单',
    terminal: 'cashier-terminal',
    username: 'operator',
    pays: [{ id: '6', name: '扫码支付', type: 'scanPay' }],
    order: {
      orderNo: 'sale-001',
      type: true,
      waitPay: 1234,
      goods: options.goods || [],
      pays: []
    },
    $store: { dispatch() {} },
    handerOrder() {
      calls.handerOrder++
    }
  })
  const pay = {
    payId: '6',
    type: 'scanPay',
    name: '扫码支付',
    code: options.code || '',
    amount: 1234,
    getAmount: 1234,
    status: false
  }
  return { cashier, calls, pay }
}

describe('云 MIS 支付门面', () => {
  it('成功结果只发送一次响应，并返回相同结果', async() => {
    const pay = new Pay()
    const order = { orderNo: 'offline-order' }
    const response = { status: config.SUCCESS, payId: 0 }
    pay.SetPool({
      CreateBookkeep(actual) {
        assert.strictEqual(actual, order)
        return Promise.resolve(response)
      }
    })
    const events = observe(pay)
    assert.strictEqual(await settled(pay.CreateBookkeep(order)), response)
    assert.deepStrictEqual(events.responses, [response])
    assert.strictEqual(events.info.length, 0)
  })

  it('闭单结果发送关闭提示及一次响应', async() => {
    const pay = new Pay()
    const response = { status: config.CLOSED, payId: 0 }
    pay.SetPool({ CreateBookkeep: () => Promise.resolve(response) })
    const events = observe(pay)
    assert.strictEqual(await settled(pay.CreateBookkeep({})), response)
    assert.deepStrictEqual(events.responses, [response])
    assert.deepStrictEqual(events.info, [{ type: 'error', message: '订单已关闭' }])
  })

  it('异步失败保留原始错误并发送错误提示', async() => {
    const pay = new Pay()
    const error = new Error('终端业务拒绝')
    pay.SetPool({ CreateBookkeep: () => Promise.reject(error) })
    const events = observe(pay)
    assert.strictEqual(await rejection(pay.CreateBookkeep({})), error)
    assert.deepStrictEqual(events.responses, [])
    assert.deepStrictEqual(events.info, [{ type: 'error', message: error.message }])
  })

  it('同步异常也进入相同错误事件及拒绝链路', async() => {
    const pay = new Pay()
    const error = new Error('创建支付时同步失败')
    pay.SetPool({
      CreateBookkeep() {
        throw error
      }
    })
    const events = observe(pay)
    assert.strictEqual(await rejection(pay.CreateBookkeep({})), error)
    assert.deepStrictEqual(events.responses, [])
    assert.deepStrictEqual(events.info, [{ type: 'error', message: error.message }])
  })
})

describe('云 MIS 收银入口', () => {
  it('无付款码且已绑定 SN 时下单、等待、查询成功，只记一次付款', async() => {
    const { cashier, calls, pay } = createCashier()
    cashier.payModelHander(pay)
    assert.strictEqual(cashier.lock, true)
    const response = await settled(calls.payment)
    assert.strictEqual(response.status, config.SUCCESS)
    assert.strictEqual(calls.createBookkeep.length, 1)
    assert.strictEqual(calls.create.length, 0)
    assert.strictEqual(calls.bookkeep.length, 1)
    assert.strictEqual(calls.query.length, 2)
    assert.strictEqual(calls.createBookkeep[0].terminalId, cashier.cloudMisSn)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(calls.createBookkeep[0], 'authCode'), false)
    assert.strictEqual(calls.localCreate[0].terminalId, cashier.cloudMisSn)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(calls.localCreate[0], 'authCode'), false)
    const request = calls.bookkeep[0].order
    assert.strictEqual(request.method, 'card')
    assert.strictEqual(request.tradeMethod, 'CloudMis')
    assert.strictEqual(request.status, 'USERPAYING')
    assert.strictEqual(request.terminalId, cashier.cloudMisSn)
    assert.strictEqual(Object.prototype.hasOwnProperty.call(request, 'authCode'), false)
    assert.strictEqual(request.totalFee, '1234')
    assert.strictEqual(request.outTradeNo, pay.orderNo)
    calls.query.forEach(call => assert.strictEqual(call.order.outTradeNo, pay.orderNo))
    assert.strictEqual(calls.responses.length, 1)
    assert.strictEqual(cashier.order.pays.length, 1)
    assert.strictEqual(cashier.order.pays[0], pay)
    assert.strictEqual(pay.status, true)
    assert.strictEqual(calls.handerOrder, 1)
    assert.strictEqual(cashier.lock, false)
  })

  it('未绑定 SN 时显示错误、释放锁且不发起支付', () => {
    const { cashier, calls, pay } = createCashier({ sn: '' })
    cashier.lock = true
    cashier.payModelHander(pay)
    assert.strictEqual(cashier.status, 'error')
    assert(cashier.payingInfo.includes('未绑定POS机SN'))
    assert.strictEqual(cashier.lock, false)
    assert.strictEqual(calls.createBookkeep.length, 0)
    assert.strictEqual(calls.bookkeep.length, 0)
    assert.strictEqual(calls.localCreate.length, 0)
    assert.strictEqual(calls.responses.length, 0)
  })

  it('普通付款码继续进入 Create 与扫码接口', async() => {
    const { cashier, calls, pay } = createCashier({ code: '281234567890123456' })
    cashier.payModelHander(pay)
    await settled(calls.payment)
    assert.strictEqual(calls.create.length, 1)
    assert.strictEqual(calls.createBookkeep.length, 0)
    assert.strictEqual(calls.bookkeep.length, 0)
    assert.strictEqual(calls.query.length, 0)
    assert.strictEqual(calls.aop.length, 1)
    assert.strictEqual(calls.aop[0].order.method, 'alipay')
    assert.strictEqual(calls.aop[0].order.authCode, pay.code)
    assert.strictEqual(calls.aop[0].order.terminalId, cashier.terminal)
    assert.strictEqual(calls.responses.length, 1)
    assert.strictEqual(cashier.order.pays.length, 1)
  })

  it('部门混合时拒绝支付、显示错误并释放锁', async() => {
    const { cashier, calls, pay } = createCashier({
      users: [],
      goods: [{ depCode: '001' }, { depCode: '002' }]
    })
    cashier.payModelHander(pay)
    const error = await rejection(calls.payment)
    assert(error.message.includes('部门'))
    assert.strictEqual(cashier.status, 'error')
    assert(cashier.payingInfo.includes('部门'))
    assert.strictEqual(cashier.lock, false)
    assert.strictEqual(calls.localCreate.length, 0)
    assert.strictEqual(calls.bookkeep.length, 0)
    assert.strictEqual(calls.responses.length, 0)
    assert.strictEqual(cashier.order.pays.length, 0)
  })

  it('本地缓存失败时传递原错误、显示错误并释放锁', async() => {
    const storageError = new Error('离线订单存储失败')
    const { cashier, calls, pay } = createCashier({ storageError })
    cashier.payModelHander(pay)
    assert.strictEqual(await rejection(calls.payment), storageError)
    assert.strictEqual(cashier.status, 'error')
    assert.strictEqual(cashier.payingInfo, storageError.message)
    assert.strictEqual(cashier.lock, false)
    assert.strictEqual(calls.bookkeep.length, 0)
    assert.strictEqual(calls.responses.length, 0)
    assert.strictEqual(cashier.order.pays.length, 0)
  })
})

describe('支付按钮', () => {
  it('编译后的扫码按钮可点击，支付锁定及会员卡按钮保持禁用', () => {
    const filename = path.join(root, 'src/renderer/views/terminal/cashier/components/pay.vue')
    const component = compiler.parseComponent(fs.readFileSync(filename, 'utf8'))
    const result = compiler.compile(component.template.content)
    assert.deepStrictEqual(result.errors, [])
    const functions = compiler.compileToFunctions(component.template.content)
    const view = new Vue({
      data() {
        return {
          lock: false,
          useTime: {},
          method: '',
          status: 'wait',
          info: '',
          payingInfo: '',
          payAmount: 0,
          pays: [
            { id: '0', type: 'cashPay', key: 'F1', name: '现金' },
            { id: '6', type: 'scanPay', key: 'F2', name: '扫码' },
            { id: '1', type: 'cardPay', name: '会员卡' },
            { id: '4', type: 'remoteCardPay', name: '远程会员卡' }
          ]
        }
      },
      methods: { handerPay() {} },
      render: functions.render,
      staticRenderFns: functions.staticRenderFns
    })
    const buttons = node => {
      if (node.tag === 'el-button') return [node]
      return (node.children || []).reduce((items, child) => items.concat(buttons(child)), [])
    }
    const initial = buttons(view._render())
    assert.strictEqual(initial.length, 4)
    assert.strictEqual(initial[0].data.attrs.disabled, false)
    assert.strictEqual(initial[1].data.attrs.disabled, false)
    assert.strictEqual(initial[2].data.attrs.disabled, true)
    assert.strictEqual(initial[3].data.attrs.disabled, true)
    view.lock = true
    buttons(view._render()).forEach(button => assert.strictEqual(button.data.attrs.disabled, true))
    view.$destroy()
  })
})
