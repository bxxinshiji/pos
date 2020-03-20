// 支付错误信息处理
const errorPay = {
  error: '',
  hander(error, method) {
    const detail = this.micro(error)
    switch (method) {
      case 'alipay':
        this.alipay(detail)
        break
      case 'wechat':
        this.wechat(detail)
        break
      default:
        break
    }
    return this.error
  },
  alipay(detail) {
    if (this.isJSON(detail)) {
      detail = JSON.parse(detail)
      switch (detail['code']) {
        case '10003':
          this.error = 'USERPAYING'
          break
        default:
          this.error = detail['sub_msg']
          break
      }
    } else {
      switch (detail) {
        case 'auth_code : cannot be empty':
          this.error = '付款码不允许为空'
          break
        default:
          this.error = detail
          break
      }
    }
  },
  wechat(detail) {
    if (this.isJSON(detail)) {
      detail = JSON.parse(detail)
      if (detail['return_msg'] !== 'OK') {
        this.error = detail['return_msg']
      }
      switch (detail['err_code']) {
        case 'USERPAYING':
          this.error = 'USERPAYING'
          break
        default:
          if (detail['err_code_des']) {
            this.error = detail['err_code_des']
          }
          break
      }
    } else {
      this.error = detail
    }
  },
  micro(error) {
    return error.response.data.detail
  },
  isJSON(str) {
    if (typeof str === 'string') {
      try {
        var obj = JSON.parse(str)
        if (typeof obj === 'object' && obj) {
          return true
        } else {
          return false
        }
      } catch (e) {
        return false
      }
    }
  }
}
export default errorPay
