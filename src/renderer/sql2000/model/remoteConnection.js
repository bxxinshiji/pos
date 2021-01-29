const Sequelize = require('sequelize')
import store from '@/store'

function sequelize(config) {
  return new Sequelize(config.database, config.username, config.password, {
    dialect: 'mssql',
    host: config.host,
    port: config.port,
    dialectOptions: {
      options: {
        useUTC: false,
        tdsVersion: '7_1',
        enableArithAbort: false,
        requestTimeout: 5000 // 超时时间 5s
      }
    },
    logging: false
  })
}

const connection = {
  DB: '',
  Pool: (config) => {
    if (config) {
      connection.DB = sequelize(config)
      return connection
    }
    connection.DB = sequelize({
      database: store.state.settings.cardRemoteSQL2000database,
      username: store.state.settings.cardRemoteSQL2000Username,
      password: store.state.settings.cardRemoteSQL2000Password,
      host: store.state.settings.cardRemoteSQL2000Host,
      port: store.state.settings.cardRemoteSQL2000Port
    })
    return connection
  }
}
export default connection
