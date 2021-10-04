import { Message } from 'element-ui'
import { Login, Logout } from '@/api/auth'
import { Info } from '@/api/user'
import { Login as LoginTerminal } from '@/api/terminal'

import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'
import settings from './settings'
import { isServer } from '@/utils/healthy'

const state = {
  token: getToken(),
  username: '',
  name: '匿名',
  userId: '',
  loginTime: new Date(),
  avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
  roles: [],
  front_permits: [],
  leave: false // 暂离
}

const mutations = {
  SET_TOKEN: (state, token) => {
    setToken(token)
    state.token = token
  },
  REMOVE_TOKEN: (state) => {
    removeToken()
    state.token = ''
  },
  SET_USERNAME: (state, username) => {
    if (username) {
      state.username = username
    }
  },
  SET_NAME: (state, name) => {
    if (name) {
      state.name = name
    }
  },
  SET_USER_ID: (state, userId) => {
    if (userId) {
      state.userId = userId
    }
  },
  SET_LOGINTIME: (state, time) => {
    if (time) {
      state.loginTime = time
    }
  },
  SET_AVATAR: (state, avatar) => {
    if (avatar) {
      state.avatar = avatar
    }
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_FRONT_PEIMITS: (state, front_permits) => {
    state.front_permits = front_permits
  }
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      if (settings.state.isTerminal) {
        // 终端模式
        LoginTerminal({ username: username.trim(), password: password }).then(response => {
          const { user, valid } = response
          if (valid) {
            commit('SET_TOKEN', user)
            resolve(valid)
          } else {
            reject(new Error('密码错误'))
            Message.closeAll()
            Message({
              message: '密码错误',
              type: 'error',
              duration: 5 * 1000
            })
          }
        }).catch(error => {
          if (error.message === 'User does not exist') {
            Message.closeAll()
            Message({
              message: '用户名不存在',
              type: 'error',
              duration: 5 * 1000
            })
            this.loading = false
          }
          reject(error)
        })
      } else {
        // 客户端模式
        Login({ username: username.trim(), password: password }).then(response => {
          const { data, valid } = response
          commit('SET_TOKEN', data.token)
          resolve(valid)
        }).catch(error => {
          const detail = error.response.data.detail
          Message({
            message: detail,
            type: 'error',
            duration: 5 * 1000
          })
          reject(error)
        })
      }
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      if (settings.state.isTerminal) {
        // 终端模式
        commit('SET_NAME', state.token.name)
        commit('SET_USERNAME', state.token.code)
        commit('SET_LOGINTIME', new Date(state.token.loginTime))
        commit('SET_ROLES', ['terminal'])
        resolve(state)
      } else {
        Info().then(response => {
          const { data } = response

          if (!data) {
            reject(new Error('Verification failed, please Login again.'))
          }
          // 用户相关信息设置
          const { username, name, avatar, id } = data.user
          commit('SET_NAME', name)
          commit('SET_USERNAME', username)
          commit('SET_USER_ID', id)
          commit('SET_AVATAR', avatar)
          // 角色相关信息设置
          let roles = ['user']
          if ('roles' in data) {
            roles = data.roles
          }
          commit('SET_ROLES', roles)
          // 前端权限相关设置
          let front_permits = []
          if ('front_permits' in data) {
            front_permits = data.front_permits
          }
          commit('SET_FRONT_PEIMITS', front_permits)
          resolve(state)
        }).catch(error => {
          reject(error)
        })
      }
    })
  },
  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      commit('REMOVE_TOKEN')
      commit('SET_ROLES')
      resetRouter()
      resolve()
    //   isServer().then(server => {
    //     if (server) {
    //       Logout().then(() => {
    //         commit('REMOVE_TOKEN')
    //         commit('SET_ROLES')
    //         resetRouter()
    //         resolve()
    //       }).catch(error => {
    //         const detail = error.response.data.detail
    //         Message({
    //           message: detail,
    //           type: 'error',
    //           duration: 5 * 1000
    //         })
    //         reject(error)
    //       })
    //     } else {
    //       commit('REMOVE_TOKEN')
    //       commit('SET_ROLES')
    //       resetRouter()
    //       resolve()
    //     }
    //   }).catch(error => {
    //     commit('REMOVE_TOKEN')
    //     commit('SET_ROLES')
    //     resetRouter()
    //     resolve()
    //     reject(error)
    //   })
    // })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('REMOVE_TOKEN')
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
