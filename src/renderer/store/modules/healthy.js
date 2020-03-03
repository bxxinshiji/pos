import { onLine, isInternet, isServer } from '@/utils/healthy'
import { isSql2000 } from '@/sql2000/utils/healthy'
const state = {
  date: new Date(), // 修改数据date
  onLine: false,
  isServer: false,
  isInternet: false,
  isSql2000: false,
  interval: null
}

const mutations = {
  SET_HEALTHY: async(state) => {
    state.onLine = onLine()
    state.isServer = await isServer()
    state.isInternet = await isInternet()
    state.isSql2000 = await isSql2000()
  },
  SET_INTERVAL: (state, interval) => {
    state.interval = interval
  },
  CLEAR_INTERVAL: (state) => {
    clearInterval(state.interval)
    state.interval = null
  }
}

const actions = {
  intervalHealthy({ commit }) {
    commit('SET_HEALTHY')
    commit('SET_INTERVAL', setInterval(() => {
      commit('SET_HEALTHY')
    }, 5000)) // 健康监测时间 5s 默认
  },
  clearInterval({ commit }) { // 注销旧的定时器
    commit('CLEAR_INTERVAL')
  }
}
setInterval(() => {
  state.date = new Date() // 修改数据date
}, 1000)
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
