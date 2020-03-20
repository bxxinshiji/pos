<template>
  <el-dialog
    :visible.sync="dialogVisible"
    top="30vh"
    width="50%"
    class="pay-container"
  >
    <span v-show="begin" class="await"><i class="fa fa-spinner fa-pulse fa-fw"></i> 付款中</span>
    <span v-show="end" class="end">
      <svg-icon :icon-class="this.order.method" :class="this.order.method"/>
      <svg-icon :icon-class="info.type" :class="info.type"/><br>
      <span v-if="sleep">{{sleep}}</span> {{ info.message }} 
    </span>
  </el-dialog>
</template>

<script>

import { AopF2F } from '@/api/pay'
// 前俯后仰 新
export default {
  name: 'Pay',
  props: {
  },
  data() {
    return {
      order: '',
      dialogVisible: false,
      begin: false,
      end: false,
      info: {
        type: 'success',
        message: ''
      },
      sleep: 0,
      wechatError: {
        SYSTEMERROR: '接口返回错误',
        PARAM_ERROR: '参数错误',
        ORDERPAID: '订单已支付',
        NOAUTH: '商户无权限	',
        AUTHCODEEXPIRE: '二维码已过期，请用户在微信上刷新后再试',
        NOTENOUGH: '余额不足',
        NOTSUPORTCARD: '不支持卡类型',
        ORDERCLOSED: '订单已关闭',
        ORDERREVERSED: '订单已撤销',
        BANKERROR: '银行系统异常',
        USERPAYING: '用户支付中，需要输入密码',
        AUTH_CODE_ERROR: '授权码参数错误',
        AUTH_CODE_INVALID: '授权码检验错误',
        XML_FORMAT_ERROR: 'XML格式错误',
        REQUIRE_POST_METHOD: '请使用post方法',
        SIGNERROR: '签名错误',
        LACK_PARAMS: '缺少参数',
        NOT_UTF8: '编码格式错误',
        BUYER_MISMATCH: '支付帐号错误',
        APPID_NOT_EXIST: 'APPID不存在',
        MCHID_NOT_EXIST: 'MCHID不存在',
        OUT_TRADE_NO_USED: '商户订单号重复	',
        APPID_MCHID_NOT_MATCH: 'appid和mch_id不匹配',
        INVALID_REQUEST: '无效请求',
        TRADE_ERROR: '交易错误'
      }
    }
  },
  computed: {
  },
  mounted() {
    setInterval(() => {
      if (this.sleep > 0) {
        this.sleep--
      }
    }, 1000)
  },
  methods: {
    handerBegin() {
      this.begin = true
      this.end = false
      this.info.message = ''
    },
    handerEnd() {
      this.begin = false
      this.end = true
    },
    handerPay(order) {
      return new Promise(async(resolve, reject) => {
        this.dialogVisible = true
        this.order = order
        this.handerBegin()
        AopF2F(this.order).then(response => {
          if (response.data.valid) {
            this.handerEnd()
            this.info = {
              type: 'success',
              message: '支付成功'
            }
          }
          // resolve(response.data.valid)
        }).catch(error => {
          this.handerEnd()
          switch (this.order.method) {
            case 'alipay':
              this.alipayHander(error)
              break
            case 'wechat':
              this.wechatHander(error)
              break
          }
          reject(error)
        })
      })
    },
    wechatHander(error) {
      if (this.isJSON(error.response.data.detail)) {
        const detail = JSON.parse(error.response.data.detail)
        if (detail['return_msg'] !== 'OK') {
          this.info = {
            type: 'error',
            message: detail['return_msg']
          }
        }
        switch (detail['err_code']) {
          case 'USERPAYING':
            this.info = {
              type: 'warning',
              message: this.wechatError.USERPAYING
            }
            this.sleep = 10
            setTimeout(() => {
              this.handerPay()
            }, this.sleep * 1000)// 等待10秒
            break
          default:
            if (detail['err_code_des']) {
              this.info = {
                type: 'error',
                message: detail['err_code_des']
              }
            }
            break
        }
      } else {
        const detail = error.response.data.detail
        this.info = {
          type: 'error',
          message: detail
        }
      }
    },
    alipayHander(error) {
      if (this.isJSON(error.response.data.detail)) {
        const detail = JSON.parse(error.response.data.detail)
        switch (detail['code']) {
          case '10003':
            this.info = {
              type: 'warning',
              message: '等待用户付款'
            }
            this.sleep = 10
            setTimeout(() => {
              this.handerPay()
            }, this.sleep * 1000)// 等待
            break
          default:
            this.info = {
              type: 'error',
              message: detail['sub_msg']
            }
            break
        }
      } else {
        const detail = error.response.data.detail
        switch (detail) {
          case 'auth_code : cannot be empty':
            this.info = {
              type: 'error',
              message: '付款码不允许为空'
            }
            break
          default:
            this.info = {
              type: 'error',
              message: detail
            }
            break
        }
      }
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
}
</script>

<style lang="less" scoped>
.pay-container{
  text-align:center
}
.await{
  font-size: 8vw;
  color: #E6A23C;
}
.wechat{
  color: #67C23A;
}
.alipay{
  color: #409EFF;
}

.end{
  font-size: 3vw;
  color: #303133;
  .svg-icon{
    font-size: 8vw;
    margin-bottom: 3vw;
  }
  .error{
    color: #F56C6C;
  }
  .success{
    color: #67C23A;
  }
  .warning{
    color: #E6A23C;
  }
}



</style>
