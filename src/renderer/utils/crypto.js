/**
 * crypto.js 加密类
 */

const crypto = require('crypto')
const Bcrypt = require('bcryptjs')

const bcrypt = {
  saltRounds: 10, // 生成salt的迭代次数
  hashSync: (password) => {
    const salt = Bcrypt.genSaltSync(bcrypt.saltRounds) // 随机生成salt
    return Bcrypt.hashSync(password, salt)
  },
  compareSync: (password, hash) => {
    return Bcrypt.compareSync(password, hash)
  }
}

const md5Sign = (data) => {
  return crypto.createHash('md5').update(data).digest('hex')
}
export { bcrypt, md5Sign }
