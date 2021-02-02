<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>

const { Op } = require('sequelize')
const ipcRenderer = require('electron').ipcRenderer
import { SyncTerminal } from '@/api/terminal'
import { SyncPayOrder } from '@/api/pay'
import { queueSyncOrder } from '@/api/order'
import { SyncSysConfig } from '@/sql2000/api/config'
import { Delete as DeleteOrder } from '@/model/api/order'
import { Delete as DeletePayOrder } from '@/model/api/payOrder'
import { Delete as DeleteOrderPD } from '@/model/api/orderPD'
import log from '@/utils/log'
export default {
  name: 'App',
  mounted() {
    this.$store.dispatch('healthy/intervalHealthy') // 健康监测启动
    this.syncTerminal()
    this.$store.dispatch('terminal/registerGlobalShortcut') // 注册全局快捷键
    // this.logout() // 软件启动先退出
    this.$store.dispatch('settings/changeSetting', { key: 'isHeader', value: false }) // 关闭头部
    ipcRenderer.on('main-process-home', (event, arg) => { // 主进程快捷键主页
      if (this.$store.state.terminal.isPay) { // 支付中禁止操作
        this.$message({
          type: 'warning',
          message: '支付锁定中,请勿进行其他操作!'
        })
      } else {
        this.$router.push({ path: '/' })
      }
    })
    this.init()
    log.h('info', 'mounted', JSON.stringify('系统启动'))
  },
  methods: {
    init() {
      SyncSysConfig()// 获取系统配置
      const dataExpires = Number(this.$store.state.settings.dataExpires)
      DeleteOrder({
        createdAt: { // 获取当天订单
          [Op.lt]: new Date(new Date(new Date().toLocaleDateString()).getTime() - dataExpires * 24 * 60 * 60 * 1000 - 1)
        },
        publish: true
      }) // 删除指定天数之前的订单
      DeletePayOrder({
        createdAt: { // 获取当天订单
          [Op.lt]: new Date(new Date(new Date().toLocaleDateString()).getTime() - dataExpires * 24 * 60 * 60 * 1000 - 1)
        },
        publish: true
      }) // 删除指定天数之前的扫码订单
      DeleteOrderPD({
        createdAt: { // 获取当天订单
          [Op.lt]: new Date(new Date(new Date().toLocaleDateString()).getTime() - 2 * dataExpires * 24 * 60 * 60 * 1000 - 1)
        },
        publish: true
      }) // 删除指定天数之前的订单 盘点商品为两倍后删除
    },
    syncTerminal() {
      setTimeout(() => {
        SyncTerminal()
      }, 5 * 1000)// 等待 5 秒后第一次同步数据
      setInterval(() => {
        SyncTerminal()
      }, 30 * 1000)
      setInterval(() => { // 同步扫码支付订单状态
        SyncPayOrder()
      }, 60 * 1000) // 1 分钟同步一次待付款订单状态
      setInterval(() => { // 自动同步订单
        // sql2000 开启并且
        if (this.$store.state.healthy.isSql2000) {
          queueSyncOrder()
        }
      }, 30 * 1000) // 0.5分钟同步一次
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}

</script>

<style lang="less">
body {
  background: #ffffff;
}
</style>
