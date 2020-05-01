// 支付错误信息处理
const hander = {
  valid: false,
  content: {},
  error: {
    code: '',
    detail: ''
  },
  hander(data, method) {
    this.valid = data.valid || false
    this.content = data.content ? JSON.parse(data.content) : ''
    this.error = data.error
    if (this.content) {
      switch (method) {
        case 'alipay':
          this.alipay()
          break
        case 'wechat':
          this.wechat()
          break
        default:
          break
      }
    }
    return this.error
  },
  alipay() {
    if (this.content['trade_status'] === 'WAIT_BUYER_PAY') {
      this.error.code = 'USERPAYING'
      this.error.detail = '等待用户付款中'
      return
    }
    if (this.content['trade_status'] === 'TRADE_CLOSED') {
      this.error.code = 'CLOSED'
      this.error.detail = '未付款交易超时关闭，或支付完成后全额退'
      return
    }
    if (this.content['trade_status'] === 'TRADE_FINISHED') {
      this.error.code = 'CLOSED'
      this.error.detail = '交易结束，不可退款'
      return
    }
    if (this.content['sub_code'] === 'ACQ.TRADE_HAS_SUCCESS') { // 交易成功请重新查询
      this.error.code = 'USERPAYING'
      this.error.detail = '等待用户付款中'
      return
    }
    switch (this.content['code']) {
      case '10003':
        this.error.code = 'USERPAYING'
        this.error.detail = '等待用户付款中'
        break
      default:
        this.error.code = this.content['code']
        this.error.detail = this.content['sub_msg']
        break
    }
  },
  wechat() {
    if (this.content['return_msg'] !== 'OK') {
      this.error.code = this.content['return_code']
      this.error.detail = this.content['return_msg']
      return
    }
    if (this.content['trade_state'] === 'USERPAYING') {
      this.error.code = 'USERPAYING'
      this.error.detail = '等待用户付款中'
      return
    }
    if (this.content['trade_state'] === 'NOTPAY') {
      this.error.code = 'USERPAYING'
      this.error.detail = '未支付'
      return
    }
    if (this.content.hasOwnProperty('trade_state')) {
      this.error.code = 'CLOSED'
      this.error.detail = this.content['trade_state_desc']
      return
    }
    switch (this.content['err_code']) {
      case 'USERPAYING':
        this.error.code = 'USERPAYING'
        this.error.detail = '等待用户付款中'
        return
      default:
        if (this.content['err_code_des']) {
          this.error.code = this.content['err_code']
          this.error.detail = this.content['err_code_des']
          return
        }
    }
  }
}
export default hander
