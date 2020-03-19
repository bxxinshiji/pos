const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  username: state => state.user.username,
  name: state => state.user.name,
  userId: state => state.user.userId,
  roles: state => state.user.roles,
  permission_routes: state => state.permission.routes,
  baseURL: state => state.settings.baseURL,
  isTerminal: state => state.settings.isTerminal
}
export default getters
