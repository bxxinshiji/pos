import sequelize from '@/model/terminalUser'
const User = sequelize.models.terminalUser
import { bcrypt } from '@/utils/crypto'

// 更新用户密码
export function Password(code, password) {
  return new Promise((resolve, reject) => {
    User.update({
      password: bcrypt.hashSync(password)
    }, {
      where: {
        code: code
      }
    }).then(response => {
      resolve(response)
    }).catch(error => {
      reject(error)
    })
  })
}
