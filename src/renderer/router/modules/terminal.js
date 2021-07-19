/** When your routing user is too long, you can split it into small modules **/

import Layout from '@/layout'

export default {
  path: '/terminal',
  component: Layout,
  redirect: '/terminal/index',
  name: 'Terminal',
  meta: {
    title: '终端',
    icon: 'terminal',
    roles: ['terminal']
  },
  children: [
    {
      path: 'cashier',
      name: 'Cashier',
      component: () => import('@/views/terminal/cashier/index'),
      meta: {
        title: '收银台',
        icon: 'cashier',
        permits: ['ui_terminal_index'],
        roles: ['terminal']
      }
    }, {
      path: 'cacheOrder',
      name: 'CacheOrder',
      component: () => import('@/views/terminal/cacheOrder/index'),
      meta: {
        title: '挂单',
        icon: 'order',
        permits: ['ui_terminal_index'],
        roles: ['terminal']
      }
    }, {
      path: 'order',
      name: 'Order',
      component: () => import('@/views/terminal/order/index'),
      meta: {
        title: '订单查询',
        icon: 'order',
        permits: ['ui_terminal_order'],
        roles: ['terminal']
      }
    }, {
      path: 'pay',
      name: 'Pay',
      component: () => import('@/views/terminal/pay/index'),
      meta: {
        title: '支付订单',
        icon: 'pay',
        permits: ['ui_terminal_pay'],
        roles: ['terminal']
      }
    }, {
      path: 'inventory',
      name: 'Inventory',
      component: () => import('@/views/terminal/inventory/index'),
      meta: {
        title: '盘点商品',
        icon: 'inventory',
        permits: ['ui_terminal_inventory'],
        roles: ['terminal']
      }
    }, {
      path: 'orderPD',
      name: 'OrderPD',
      component: () => import('@/views/terminal/orderPD/index'),
      meta: {
        title: '盘点订单',
        icon: 'orderPD',
        permits: ['ui_terminal_orderPD'],
        roles: ['terminal']
      }
    }, {
      path: 'password',
      name: 'Password',
      component: () => import('@/views/terminal/password/index'),
      meta: {
        title: '修改密码',
        icon: 'password',
        permits: ['ui_terminal_password'],
        roles: ['terminal']
      }
    }, {
      path: 'config',
      name: 'Config',
      component: () => import('@/views/terminal/config/index'),
      meta: {
        title: '系统配置',
        icon: 'config',
        permits: ['ui_terminal_config'],
        roles: ['terminal']
      }
    }
  ]
}
