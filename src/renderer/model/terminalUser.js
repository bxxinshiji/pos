const Sequelize = require('sequelize')
import path from 'path'
import { exePath } from '@/utils'
import { bcrypt } from '@/utils/crypto'
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(exePath('database'), '/terminalUser.sqlite'),
  logging: false
  // timezone: '+08:00'
})

sequelize.authenticate().then(() => {
  console.log('Connection terminalUser successfully.')
}).catch(err => {
  console.error('Unable to connect to the terminalUser database:', err)
})

// TerminalUser terminal机本地用户
const TerminalUser = sequelize.define('terminalUser', {
  code: { type: Sequelize.STRING, unique: true }, // 自编码
  name: Sequelize.STRING, // 终端编号
  password: Sequelize.STRING // 检查远程更新时间
}, {})
// 初始化数据模型
sequelize.sync({
  // force: true
})

// 实现方法
/**
 * Auth 登陆验证
 */
TerminalUser.Auth = ({ username, password }) => {
  return new Promise((resolve, reject) => {
    TerminalUser.findOne({
      where: {
        code: username
      }
    }).then((project) => {
      if (project) {
        project.dataValues.loginTime = new Date() // 登录时间
        resolve({ user: project.dataValues, valid: bcrypt.compareSync(password, project.get('password')) })
      } else {
        reject(new Error('User does not exist'))
      }
    }).catch(error => {
      reject(error)
    })
  })
}
export default sequelize
