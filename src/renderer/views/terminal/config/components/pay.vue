<template>
    <el-form :inline=true  :model="ruleForm" ref="ruleForm" label-width="100px">
                <el-form-item label="扫码商户ID"  :prop="ruleForm.scanStoreId">
                    <el-input v-model="ruleForm.scanStoreId">></el-input>
                </el-form-item>
                <el-form-item label="扫码付款方式"  :prop="ruleForm.scanPayId">
                    <el-select v-model="ruleForm.scanPayId" placeholder="请选择支付">
                      <el-option
                        v-for="(item,index) in scanPay"
                        :key="index"
                        :label="item.name"
                        :value="String(item.id)">
                      </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="订单名称"  :prop="ruleForm.orderTitle">
                    <el-input v-model="ruleForm.orderTitle">></el-input>
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
      ruleForm: {
        scanStoreId: this.$store.state.settings.scanStoreId,
        scanPayId: this.$store.state.settings.scanPayId,
        orderTitle: this.$store.state.settings.orderTitle
      }
    }
  },
  computed: {
  },
  created() {
  },
  mounted() {
    this.getScanPay()
  },
  methods: {
    getScanPay() {
      const listQuery = {
        where: {
          type: 'scanPay'
        }
      }
      Get(listQuery).then(response => {
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
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
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
