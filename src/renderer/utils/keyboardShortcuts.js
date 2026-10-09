const Mousetrap = require('mousetrap')
require('./mousetrap-global-bind')

const owners = new Map()
const shortcuts = new Map()
const paymentEvents = new WeakSet()

// 按页面实例保存绑定，支付优先级高于普通收银和全局快捷键。
export function registerShortcuts(owner, bindings, priority = 0) {
  unregisterShortcuts(owner)
  const keys = new Set()
  Object.keys(bindings).forEach(key => {
    const shortcut = normalizeShortcut(key)
    if (!shortcut) return
    const items = shortcuts.get(shortcut) || []
    items.push({ owner, callback: bindings[key], priority })
    shortcuts.set(shortcut, items)
    keys.add(shortcut)
    updateShortcut(shortcut)
  })
  owners.set(owner, keys)
}

// 只释放本实例的绑定，重复释放不会删除已恢复或新页面的快捷键。
export function unregisterShortcuts(owner) {
  const keys = owners.get(owner)
  if (!keys) return
  owners.delete(owner)
  keys.forEach(key => {
    const items = shortcuts.get(key).filter(item => item.owner !== owner)
    if (items.length) {
      shortcuts.set(key, items)
    } else {
      shortcuts.delete(key)
    }
    updateShortcut(key)
  })
}

// Home 由主进程投递，只向活动支付绑定分发，锁定提示也算已消费。
export function triggerPaymentShortcut(key, event) {
  const shortcut = normalizeShortcut(key)
  const binding = getBinding(shortcut)
  if (!binding || binding.priority <= 0) return false
  runBinding(binding, event, shortcut)
  return true
}

// 同一个按键事件被支付消费后，扫码、退出和聚焦监听不再重复处理。
export function isPaymentShortcutEvent(event) {
  return paymentEvents.has(event)
}

function normalizeShortcut(key) {
  const aliases = {
    escape: 'esc',
    return: 'enter',
    arrowup: 'up',
    arrowdown: 'down',
    arrowleft: 'left',
    arrowright: 'right',
    delete: 'del',
    insert: 'ins',
    control: 'ctrl',
    ' ': 'space'
  }
  const shortcut = key.toLowerCase()
  return aliases[shortcut] || shortcut.trim()
}

function updateShortcut(key) {
  // Home 不另绑渲染层，避免主进程 IPC 与 DOM 事件重复发起支付。
  if (key === 'home') return
  if (!shortcuts.has(key)) {
    Mousetrap.unbindGlobal(key)
    return
  }
  Mousetrap.bindGlobal(key, event => runBinding(getBinding(key), event, key))
}

function getBinding(key) {
  return (shortcuts.get(key) || []).reduce((active, item) => {
    return !active || item.priority >= active.priority ? item : active
  }, null)
}

function runBinding(binding, event, key) {
  if (binding.priority > 0 && event) paymentEvents.add(event)
  const result = binding.callback(event, key)
  return binding.priority > 0 ? false : result
}
