import Store from '@/utils/electron-store'
const TokenKey = 'X-Token'

export function getToken() {
  return Store.get(TokenKey)
}

export function setToken(token) {
  return Store.set(TokenKey, token)
}

export function removeToken() {
  return Store.delete(TokenKey)
}
