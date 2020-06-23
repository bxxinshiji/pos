import user from '@/sql2000/model/user'
import { bcrypt } from '@/utils/crypto'
import sequelize from '@/model/terminalUser'

const TerminalUser = sequelize.models.terminalUser

export function SyncUser() {
  return new Promise((resolve, reject) => {
    user.All().then(async response => {
      if (response) {
        const users = []
        response.forEach(item => {
          users.push({
            code: item.code,
            name: item.name,
            password: bcrypt.hashSync(item.password)
          })
        })
        if (users.length > 0) {
          // 重新构建数据库文件
          await sequelize.sync({
            force: true
          })
          TerminalUser.bulkCreate(users).then(() => {
            resolve()
          }).catch(error => {
            reject(new Error('插入用户数据失败:' + error.message))
          })
        }
      }
    }).catch(error => {
      reject(new Error('查询用户失败:' + error.message))
    })
  })
}
