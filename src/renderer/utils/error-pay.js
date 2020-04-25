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
      if (detail['trade_status'] === 'WAIT_BUYER_PAY') {
        this.error = 'USERPAYING'
        return
      }
      if (detail['trade_status'] === 'TRADE_CLOSED') {
        this.error = '未付款交易超时关闭，或支付完成后全额退'
        return
      }
      if (detail['trade_status'] === 'TRADE_FINISHED') {
        this.error = '交易结束，不可退款'
        return
      }
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
        return
      }
      if (detail['trade_state'] === 'USERPAYING' || detail['trade_state'] === 'NOTPAY') {
        this.error = 'USERPAYING'
        return
      }
      if (detail.hasOwnProperty('trade_state')) {
        this.error = detail['trade_state_desc']
        return
      }
      switch (detail['err_code']) {
        case 'USERPAYING':
          this.error = 'USERPAYING'
          return
        default:
          if (detail['err_code_des']) {
            this.error = detail['err_code_des']
            return
          }
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
