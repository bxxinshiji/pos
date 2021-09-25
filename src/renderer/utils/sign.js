const crypto = require('crypto')
/**
* 验证签名
* @param   {String} content     签名串
* @param   {String} content     签名
* @param   {String} publicKey   公钥
* @returns {Boolean}
*/
export function VerifyContent(content, sign, publicKey) {
  var verifySign = crypto.createVerify('RSA-SHA256')
  verifySign.update(content)
  return verifySign.verify(publicKey, sign, 'base64')
}

/**
* 生成签名
* @param   {String} content     签名内容
* @param   {String} privateKey  私钥
* @returns  {String}
*/
export function GetSign(content, privateKey) {
  var cryptoSign = crypto.createSign('RSA-SHA256')
  cryptoSign.update(content, 'utf8')
  return cryptoSign.sign(privateKey, 'base64')
}

/**
 * 获取签名内容
 * 排序并且去掉空白字段
 */
export function GetSignContent(obj, method) {
  const temp = {}
  Object.keys(obj).sort().forEach(key => {
    if (typeof obj[key] === 'object') {
      if (JSON.stringify(obj[key]) !== '{}') {
        temp[key] = GetSignContent(obj[key])
      }
    } else {
      if (obj[key] !== '' && obj[key] !== 0) {
        temp[key] = obj[key]
      }
    }
  })
  return temp
}
