<template>
    <el-form :inline=true  :model="ruleForm" ref="ruleForm" label-width="100px">
                <el-form-item label="扫码商户名"  :prop="ruleForm.scanStoreName">
                    <el-input v-model="ruleForm.scanStoreName">></el-input>
                </el-form-item>
                <el-form-item label="扫码保存类型"  :prop="ruleForm.scanPayId">
                    <el-select v-model="ruleForm.scanPayId" placeholder="请选择支付">
                      <el-option
                        v-for="(item,index) in scanPay"
                        :key="index"
                        :label="item.name"
                        :value="String(item.id)">
                      </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="扫码订单名称"  :prop="ruleForm.orderTitle">
                    <el-input v-model="ruleForm.orderTitle">></el-input>
                </el-form-item>
                <el-form-item label="会员卡保存类型"  :prop="ruleForm.cardPayID">
                    <el-select v-model="ruleForm.cardPayID" placeholder="请选择支付">
                      <el-option
                        v-for="(item,index) in cardPay"
                        :key="index"
                        :label="item.name + (item.type==='remoteCardPay'?' [远程]':' [本地]')"
                        :value="String(item.id)">
                      </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="云MIS发起类型"  :prop="ruleForm.cloudMisPayId">
                    <el-select v-model="ruleForm.cloudMisPayId" placeholder="不启用云MIS支付" clearable>
                      <el-option
                        v-for="(item,index) in scanPay"
                        :key="index"
                        :label="item.name"
                        :value="String(item.id)">
                      </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="POS机SN绑定"  :prop="ruleForm.cloudMisSn">
                    <el-input v-model="ruleForm.cloudMisSn" placeholder="聚焦后扫码枪扫描SN条码自动录入,再扫自动更换,清空保存即解绑" @focus="$event.target.select()"></el-input>
                </el-form-item>
                <br>
                <el-form-item>
                    <el-button type="primary" @click="submitForm('ruleForm')">保存</el-button>
                    <el-button @click="resetForm('ruleForm')">重置</el-button>
                </el-form-item>
    </el-form>
</template>

<script>
import { Get } from '@/model/api/pay'
export default {
  name: 'payKeyboard',
  data() {
    return {
      scanPay: [],
      cardPay: [],
      ruleForm: {
        scanStoreName: this.$store.state.settings.scanStoreName,
        orderTitle: this.$store.state.settings.orderTitle,
        scanPayId: this.$store.state.settings.scanPayId,
        cardPayID: this.$store.state.settings.cardPayID, // 会员卡刷卡数据
        cloudMisPayId: this.$store.state.settings.cloudMisPayId, // 云MIS发起支付方式
        cloudMisSn: this.$store.state.settings.cloudMisSn // 云MIS绑定POS机SN
      }
    }
  },
  computed: {
  },
  created() {
  },
  mounted() {
    this.getScanPay()
    this.getCardPay()
  },
  methods: {
    getScanPay() {
      Get({
        where: {
          type: 'scanPay'
        }
      }).then(response => {
        if (response.length) {
          this.scanPay = response
        } else {
          this.$message({
            type: 'warning',
            message: '未找到查询扫码支付方式,请联系管理员。'
          })
        }
      }).catch(error => {
        this.$message({
          type: 'error',
          message: '查询扫码支付方式失败:' + error
        })
      })
    },
    getCardPay() {
      Get({
        where: {
          type: ['cardPay', 'remoteCardPay']
        }
      }).then(response => {
        if (response.length) {
          this.cardPay = response
        } else {
          this.$message({
            type: 'warning',
            message: '未找到查询会员卡支付方式,请联系管理员。'
          })
        }
      }).catch(error => {
        this.$message({
          type: 'error',
          message: '查询会员卡支付方式失败:' + error
        })
      })
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          if (this.ruleForm.cloudMisPayId && String(this.ruleForm.cloudMisPayId) === String(this.ruleForm.scanPayId)) { // 云MIS发起类型与扫码保存类型相同时 付款码扫码会被误拦截为云MIS
            this.$message({
              type: 'error',
              message: '云MIS发起类型不允许与扫码保存类型相同!'
            })
            return false
          }
          Object.keys(this.ruleForm).forEach(key => {
            this.$store.dispatch('settings/changeSetting', { key, value: this.ruleForm[key] })
          })
          this.$message({
            type: 'success',
            message: '保存成功'
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    resetForm(formName) {
      this.$refs[formName].resetFields()
    }
  }
}
</script>

<style lang="less" scoped>
</style>
